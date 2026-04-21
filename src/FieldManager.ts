import equal from 'fast-deep-equal'

import type { DebouncedFunction } from './util/throttle-debounce'
import { debounce } from './util/throttle-debounce'

import type {
  FieldOptions,
  FieldState,
  IFieldManager,
  ReadonlyField,
  Validator,
} from './types'

type AllFieldsProvider = () => Record<string, ReadonlyField<unknown>>

export class FieldManager<T = unknown> implements IFieldManager<T> {
  public readonly name: string

  private _state: FieldState<T>
  private _options: FieldOptions<T>
  private _subscribers: Set<(state: FieldState<T>) => void> = new Set()
  private _debouncedValidate: DebouncedFunction<() => void> | null = null
  private _initialValue: T
  private _allFieldsProvider: AllFieldsProvider | null = null
  // Monotonic counter to discard stale async validation results.
  private _validationSeq = 0

  public get state(): Readonly<FieldState<T>> {
    return this._state
  }

  public get options(): Readonly<FieldOptions<T>> {
    return this._options
  }

  constructor(name: string, options: FieldOptions<T> = {}) {
    this.name = name

    this._options = {
      defaultValue: undefined as T,
      validationDelay: 0,
      required: false,
      readOnly: false,
      ...options,
    }

    this._initialValue = this._options.defaultValue as T

    this._state = {
      value: this._initialValue,
      error: null,
      isChanged: false,
      isValidating: false,
      isValidated: false,
      isValid: true,
      isTouched: false,
    }

    this._setupDebouncedValidate()
  }

  _attachFieldsProvider(provider: AllFieldsProvider): void {
    this._allFieldsProvider = provider
  }

  updateOptions(next: FieldOptions<T>): void {
    const prev = this._options
    const merged: FieldOptions<T> = {
      ...prev,
      ...next,
      // defaultValue is captured at construction time; never overwrite the
      // initial value after the fact via updateOptions (use
      // _replaceInitialValue for that).
      defaultValue: prev.defaultValue,
    }

    if (equal(prev, merged)) return

    const delayChanged = prev.validationDelay !== merged.validationDelay
    this._options = merged

    if (delayChanged) {
      this._debouncedValidate?.cancel()
      this._debouncedValidate = null
      this._setupDebouncedValidate()
    }
  }

  _replaceInitialValue(value: T): void {
    this._initialValue = value
    this._options = { ...this._options, defaultValue: value }
    if (!this._state.isChanged) {
      this._updateState({ value })
    }
  }

  setValue(value: T | ((prevState: T) => T)): void {
    if (this._options.readOnly) return

    const newValue =
      typeof value === 'function' ? (value as (prev: T) => T)(this._state.value) : value

    if (equal(newValue, this._state.value)) return

    this._updateState({
      value: newValue,
      isChanged: true,
      isTouched: true,
    })

    if (this._debouncedValidate) {
      this._debouncedValidate()
    }
    else {
      void this.validate()
    }
  }

  getValue(): T {
    return this._state.value
  }

  reset(): void {
    this._debouncedValidate?.cancel()
    this._validationSeq++
    this._updateState({
      value: this._initialValue,
      error: null,
      isChanged: false,
      isValidating: false,
      isValidated: false,
      isValid: true,
      isTouched: false,
    })
  }

  async validate(): Promise<string | null> {
    return this._validateInternal()
  }

  private async _validateInternal(): Promise<string | null> {
    const seq = ++this._validationSeq
    const isCurrent = () => seq === this._validationSeq

    const validators: Validator<T>[] = this._options.validators || []
    const emptyCheckFn = this._options.emptyCheckFn || this._isEmpty
    const allFields = this._allFieldsProvider?.() ?? {}

    if (this._options.required && emptyCheckFn(this._state.value)) {
      const error = 'This field is required'
      if (isCurrent()) {
        this._updateState({
          error,
          isValid: false,
          isValidating: false,
          isValidated: true,
        })
      }
      return error
    }

    if (validators.length === 0) {
      if (isCurrent()) {
        this._updateState({
          error: null,
          isValid: true,
          isValidating: false,
          isValidated: true,
        })
      }
      return null
    }

    if (isCurrent()) {
      this._updateState({ isValidating: true })
    }

    try {
      for (const validator of validators) {
        const result = await validator(this._state.value, allFields)
        if (!isCurrent()) {
          return result
        }
        if (result) {
          this._updateState({
            error: result,
            isValid: false,
            isValidating: false,
            isValidated: true,
          })
          return result
        }
      }

      if (isCurrent()) {
        this._updateState({
          error: null,
          isValid: true,
          isValidating: false,
          isValidated: true,
        })
      }
      return null
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation error'
      if (isCurrent()) {
        this._updateState({
          error: errorMessage,
          isValid: false,
          isValidating: false,
          isValidated: true,
        })
      }
      return errorMessage
    }
  }

  setError(error: string | null): void {
    this._updateState({
      error,
      isValid: !error,
      isValidated: true,
    })
  }

  clearError(): void {
    this._updateState({
      error: null,
      isValid: true,
    })
  }

  markAsTouched(): void {
    if (!this._state.isTouched) {
      this._updateState({ isTouched: true })
    }
  }

  markAsChanged(): void {
    if (!this._state.isChanged) {
      this._updateState({ isChanged: true })
    }
  }

  subscribe(callback: (state: FieldState<T>) => void): () => void {
    this._subscribers.add(callback)
    return () => {
      this._subscribers.delete(callback)
    }
  }

  private _setupDebouncedValidate(): void {
    if (this._options.validationDelay && this._options.validationDelay > 0) {
      this._debouncedValidate = debounce(() => {
        void this._validateInternal()
      }, this._options.validationDelay)
    }
  }

  private _updateState(changes: Partial<FieldState<T>>): void {
    const newState = { ...this._state, ...changes }

    if (!equal(this._state, newState)) {
      this._state = newState
      this._notifySubscribers()
    }
  }

  private _notifySubscribers(): void {
    this._subscribers.forEach((callback) => {
      try {
        callback(this._state)
      }
      catch (error) {
        console.error('Error in field subscriber:', error)
      }
    })
  }

  private _isEmpty = (value: T): boolean => {
    if (value === undefined || value === null) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value as object).length === 0
    return false
  }

  destroy(): void {
    this._debouncedValidate?.cancel()
    this._debouncedValidate = null
    this._subscribers.clear()
    this._allFieldsProvider = null
    this._validationSeq++
  }
}
