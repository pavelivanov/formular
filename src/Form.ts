import equal from 'fast-deep-equal'

import EventEmitter from './util/EventEmitter'

import { FieldManager } from './FieldManager'
import type { FieldOptions, FormState, ReadonlyField } from './types'

export const eventNames = {
  stateChange: 'state change',
  fieldRegistered: 'field registered',
  fieldUnregistered: 'field unregistered',
  change: 'change',
  submit: 'submit',
  submitError: 'submit error',
} as const

export type FormEventName = (typeof eventNames)[keyof typeof eventNames]
export type FormEventMap = Record<FormEventName, (...args: any[]) => void>

export type FormFields<FieldValues extends Record<string, any>> = {
  [K in keyof FieldValues]: FieldManager<FieldValues[K]>
}

export type SubmitResult<FieldValues extends Record<string, any>> = {
  values: FieldValues
  errors: Record<string, string> | null
  isValid: boolean
}

export type SubmitErrorContext<FieldValues extends Record<string, any>> =
  SubmitResult<FieldValues> & {
    phase: 'submit' | 'onSuccess'
  }

export type FormOptions<FieldValues extends Record<string, any>> = {
  formId?: string
  initialValues?: Partial<FieldValues>
  /**
   * Called by submit() once validation has passed. If you drive submission
   * via form.handleSubmit(cb), prefer passing the callback there and leave
   * this undefined to avoid double invocation.
   */
  onSubmit?: (values: FieldValues) => void | Promise<void>
  /**
   * Called only when field values have actually changed. Does NOT fire on
   * field registration / unregistration.
   */
  onChange?: (values: FieldValues) => void
  /**
   * Called when submit() or handleSubmit() encounters an error.
   */
  onSubmitError?: (error: unknown, context: SubmitErrorContext<FieldValues>) => void
}

export class Form<FieldValues extends Record<string, any>> {
  private _events: EventEmitter<FormEventMap>
  private _fields: FormFields<FieldValues> = {} as any
  private _fieldUnsubscribers: Map<string, () => void> = new Map()
  private _fieldRegistrationCounts: Map<string, number> = new Map()
  private _isReseeding = false
  // Values queued by setValues() / setInitialValues() for field names that
  // haven't registered yet. Consumed and cleared in registerField().
  private _pendingValues: Partial<FieldValues> = {}
  private _pendingInitialValues: Partial<FieldValues> = {}
  private _pendingErrors: Record<string, string | null> = {}
  private _batchDepth = 0
  private _pendingFormStateUpdate: { skipOnChange: boolean } | null = null
  private _options: FormOptions<FieldValues>
  private _state: FormState

  public readonly formId?: string

  public get options(): Readonly<FormOptions<FieldValues>> {
    return this._options
  }

  public get state(): Readonly<FormState> {
    return this._state
  }

  setOptions(options: Partial<FormOptions<FieldValues>>): void {
    this._options = { ...this._options, ...options }
  }

  constructor(options: FormOptions<FieldValues> = {}) {
    this.formId = options.formId
    this._options = options
    this._events = new EventEmitter()

    this._state = {
      isValid: true,
      isChanged: false,
      isValidating: false,
      isSubmitting: false,
      isSubmitted: false,
      values: {},
      errors: {},
    }
  }

  registerField<K extends keyof FieldValues>(
    name: K,
    options: FieldOptions<FieldValues[K]> = {},
    preferredField?: FieldManager<FieldValues[K]>,
  ): FieldManager<FieldValues[K]> {
    const fieldKey = String(name)
    const existing = this._fields[name]
    if (existing) {
      existing.updateOptions(options)
      this._fieldRegistrationCounts.set(
        fieldKey,
        (this._fieldRegistrationCounts.get(fieldKey) ?? 1) + 1,
      )
      return existing
    }

    // Precedence (highest → lowest):
    //   setValues() buffered value >
    //   setInitialValues() buffered initial >
    //   constructor initialValues >
    //   options.defaultValue
    const hasPending = name in this._pendingValues
    const hasPendingInitial = name in this._pendingInitialValues
    const hasConstructorInitial = this._options.initialValues?.[name] !== undefined

    const seedInitial: FieldValues[K] = hasPendingInitial
      ? (this._pendingInitialValues[name] as FieldValues[K])
      : hasConstructorInitial
        ? (this._options.initialValues![name] as FieldValues[K])
        : (options.defaultValue as FieldValues[K])

    const fieldOptions: FieldOptions<FieldValues[K]> = {
      ...options,
      defaultValue: seedInitial,
    }

    const field =
      preferredField ?? new FieldManager<FieldValues[K]>(String(name), fieldOptions)

    if (preferredField) {
      field.updateOptions(fieldOptions)
      field._replaceInitialValue(seedInitial)
    }

    field._attachFieldsProvider(() => this._getFieldsForValidators())
    this._fields[name] = field
    this._fieldRegistrationCounts.set(fieldKey, 1)

    const unsubscribe = field.subscribe(() => {
      this._requestFormStateUpdate({ skipOnChange: this._isReseeding })
    })
    this._fieldUnsubscribers.set(String(name), unsubscribe)

    if (hasPending) {
      field.setValue(this._pendingValues[name] as FieldValues[K])
      delete this._pendingValues[name]
    }
    if (hasPendingInitial) {
      delete this._pendingInitialValues[name]
    }
    if (Object.prototype.hasOwnProperty.call(this._pendingErrors, fieldKey)) {
      field.setError(this._pendingErrors[fieldKey] ?? null)
      delete this._pendingErrors[fieldKey]
    }

    this._events.emit(eventNames.fieldRegistered, name, field)
    this._requestFormStateUpdate({ skipOnChange: true })

    return field
  }

  unregisterField<K extends keyof FieldValues>(name: K): void {
    const fieldKey = String(name)
    const field = this._fields[name]
    if (!field) return

    const registrations = this._fieldRegistrationCounts.get(fieldKey) ?? 0
    if (registrations > 1) {
      this._fieldRegistrationCounts.set(fieldKey, registrations - 1)
      return
    }
    this._fieldRegistrationCounts.delete(fieldKey)

    const unsubscribe = this._fieldUnsubscribers.get(fieldKey)
    unsubscribe?.()
    this._fieldUnsubscribers.delete(fieldKey)

    field.destroy()
    delete this._fields[name]
    this._events.emit(eventNames.fieldUnregistered, name)
    this._requestFormStateUpdate({ skipOnChange: true })
  }

  getField<K extends keyof FieldValues>(
    name: K,
  ): FieldManager<FieldValues[K]> | undefined {
    return this._fields[name]
  }

  getAllFields(): FormFields<FieldValues> {
    return { ...this._fields }
  }

  getValues(): FieldValues {
    const values: FieldValues = {} as any
    ;(Object.keys(this._fields) as Array<keyof FieldValues>).forEach((name) => {
      values[name] = this._fields[name].getValue()
    })
    return values
  }

  setValues(values: Partial<FieldValues>): void {
    ;(Object.keys(values) as Array<keyof FieldValues>).forEach((name) => {
      const field = this._fields[name]
      if (field) {
        field.setValue(values[name] as FieldValues[typeof name])
      }
      else {
        this._pendingValues[name] = values[name]
      }
    })
  }

  setInitialValues(values: Partial<FieldValues>): void {
    this._options = {
      ...this._options,
      initialValues: { ...this._options.initialValues, ...values },
    }

    this._isReseeding = true
    try {
      this._batch(() => {
        ;(Object.keys(values) as Array<keyof FieldValues>).forEach((name) => {
          const field = this._fields[name]
          const next = values[name] as FieldValues[typeof name]
          if (field) {
            field._replaceInitialValue(next)
          }
          else {
            this._pendingInitialValues[name] = next
          }
        })

        this._requestFormStateUpdate({ skipOnChange: true })
      })
    }
    finally {
      this._isReseeding = false
    }
  }

  getErrors(): Record<string, string> {
    const errors: Record<string, string> = {}
    ;(Object.keys(this._fields) as Array<keyof FieldValues>).forEach((name) => {
      const error = this._fields[name].state.error
      if (error) {
        errors[String(name)] = error
      }
    })
    return errors
  }

  setErrors(errors: Record<string, string | null>): void {
    this._batch(() => {
      Object.keys(errors).forEach((name) => {
        const field = this._fields[name]
        if (field) {
          field.setError(errors[name])
          return
        }

        if (errors[name] === null) {
          delete this._pendingErrors[name]
          return
        }

        this._pendingErrors[name] = errors[name]
      })
    })
  }

  async validate(): Promise<boolean> {
    this.setState({ isValidating: true })

    const fields = Object.values(this._fields) as FieldManager<any>[]
    await Promise.all(fields.map((field) => field.validate()))

    const isValid = fields.every((field) => field.state.isValid)
    this.setState({ isValid, isValidating: false })

    return isValid
  }

  async submit(): Promise<SubmitResult<FieldValues>> {
    this.setState({ isSubmitting: true })

    try {
      const isValid = await this.validate()
      const values = this.getValues()
      const errors = isValid ? null : this.getErrors()

      if (isValid && this._options.onSubmit) {
        await this._options.onSubmit(values)
      }

      this.setState({
        isSubmitting: false,
        isSubmitted: isValid ? true : this._state.isSubmitted,
      })

      this._events.emit(eventNames.submit, { values, errors })

      return { values, errors, isValid }
    }
    catch (error) {
      const values = this.getValues()
      const nextErrors = this.getErrors()
      const errors = Object.keys(nextErrors).length > 0 ? nextErrors : null
      const result: SubmitResult<FieldValues> = {
        values,
        errors,
        isValid: errors === null,
      }
      this.setState({ isSubmitting: false })
      this._events.emit(eventNames.submit, { values, errors })
      this._notifySubmitError(error, { ...result, phase: 'submit' })
      throw error
    }
  }

  handleSubmit(
    onSuccess?: (values: FieldValues) => void | Promise<void>,
  ): (event?: Event | { preventDefault?: () => void }) => Promise<void> {
    return async (event) => {
      event?.preventDefault?.()
      try {
        const submitResult = await this.submit()
        if (submitResult.isValid && onSuccess) {
          try {
            await onSuccess(submitResult.values)
          }
          catch (error) {
            this._notifySubmitError(error, { ...submitResult, phase: 'onSuccess' })
          }
        }
      }
      catch {
        // submit() already emitted `submit` and `submitError`; keep UI handlers
        // non-throwing to avoid unhandled async rejections in React events.
      }
    }
  }

  reset(): void {
    this._batch(() => {
      Object.values(this._fields).forEach((field) => {
        ;(field as FieldManager<any>).reset()
      })

      this._pendingValues = {}
      this._pendingErrors = {}

      this._state = {
        ...this._state,
        isValid: true,
        isChanged: false,
        isValidating: false,
        isSubmitting: false,
        isSubmitted: false,
      }

      this._requestFormStateUpdate({ skipOnChange: true })
    })
  }

  setState(values: Partial<FormState>): void {
    const newState = { ...this._state, ...values }
    if (equal(this._state, newState)) return
    this._state = newState
    this._events.emit(eventNames.stateChange, this._state)
  }

  private _updateFormState(opts: { skipOnChange?: boolean } = {}): void {
    const values = this.getValues()
    const errors = this.getErrors()
    const fields = Object.values(this._fields) as FieldManager<any>[]
    const isValid = fields.every((field) => field.state.isValid)
    const isChanged = fields.some((field) => field.state.isChanged)
    const isValidating = fields.some((field) => field.state.isValidating)

    const valuesChanged = !equal(this._state.values, values)
    const next: FormState = {
      ...this._state,
      isValid,
      isChanged,
      isValidating,
      values,
      errors,
    }
    const stateChanged = !equal(this._state, next)
    this._state = next

    if (!opts.skipOnChange && valuesChanged) {
      this._options.onChange?.(values)
      this._events.emit(eventNames.change, values)
    }

    if (stateChanged) {
      this._events.emit(eventNames.stateChange, this._state)
    }
  }

  private _requestFormStateUpdate(opts: { skipOnChange?: boolean } = {}): void {
    if (this._batchDepth > 0) {
      const skipOnChange = opts.skipOnChange ?? false
      if (this._pendingFormStateUpdate) {
        this._pendingFormStateUpdate.skipOnChange =
          this._pendingFormStateUpdate.skipOnChange || skipOnChange
      }
      else {
        this._pendingFormStateUpdate = { skipOnChange }
      }
      return
    }

    this._updateFormState(opts)
  }

  private _batch(fn: () => void): void {
    this._batchDepth += 1
    try {
      fn()
    }
    finally {
      this._batchDepth -= 1

      if (this._batchDepth === 0 && this._pendingFormStateUpdate) {
        const pending = this._pendingFormStateUpdate
        this._pendingFormStateUpdate = null
        this._updateFormState({ skipOnChange: pending.skipOnChange })
      }
    }
  }

  private _getFieldsForValidators(): Record<string, ReadonlyField<unknown>> {
    const out: Record<string, ReadonlyField<unknown>> = {}
    ;(Object.keys(this._fields) as Array<keyof FieldValues>).forEach((k) => {
      out[String(k)] = this._fields[k]
    })
    return out
  }

  private _notifySubmitError(
    error: unknown,
    context: SubmitErrorContext<FieldValues>,
  ): void {
    this._options.onSubmitError?.(error, context)
    this._events.emit(eventNames.submitError, error, context)
  }

  on<K extends FormEventName>(eventName: K, handler: FormEventMap[K]): () => void {
    this._events.addListener(eventName, handler)
    return () => {
      this._events.removeListener(eventName, handler)
    }
  }

  once<K extends FormEventName>(eventName: K, handler: FormEventMap[K]): () => void {
    this._events.once(eventName, handler)
    return () => {
      this._events.removeListener(eventName, handler)
    }
  }

  off<K extends FormEventName>(eventName: K, handler: FormEventMap[K]): void {
    this._events.removeListener(eventName, handler)
  }

  destroy(): void {
    this._fieldUnsubscribers.forEach((unsub) => unsub())
    this._fieldUnsubscribers.clear()
    this._fieldRegistrationCounts.clear()
    Object.values(this._fields).forEach((field) =>
      (field as FieldManager<any>).destroy(),
    )
    this._fields = {} as any
    this._pendingValues = {}
    this._pendingInitialValues = {}
    this._pendingErrors = {}
    this._pendingFormStateUpdate = null
    this._batchDepth = 0
    this._events.removeAllListeners()
  }
}
