import equal from 'fast-deep-equal'

import EventEmitter from './util/EventEmitter'

import { FieldManager } from './FieldManager'
import type { DeepPartial, Path, PathValue } from './paths'
import { isPlainObject, setByPath } from './paths'
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

/**
 * Map of every registered field, keyed by its dotted path. The value-type
 * of individual entries is erased here — use `Form.getField(path)` to get a
 * typed `FieldManager<PathValue<T, P>>`.
 */
export type FormFields = Record<string, FieldManager<any>>

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
  initialValues?: DeepPartial<FieldValues>
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
  private _fields: Map<string, FieldManager<any>> = new Map()
  private _fieldUnsubscribers: Map<string, () => void> = new Map()
  private _fieldRegistrationCounts: Map<string, number> = new Map()
  private _isReseeding = false
  // Values queued by setValues() / setInitialValues() for field paths that
  // haven't registered yet. Keyed by dotted path. Consumed and cleared in
  // registerField().
  private _pendingValues: Record<string, unknown> = {}
  private _pendingInitialValues: Record<string, unknown> = {}
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

  registerField<P extends Path<FieldValues>>(
    name: P,
    options: FieldOptions<PathValue<FieldValues, P>> = {},
    preferredField?: FieldManager<PathValue<FieldValues, P>>,
  ): FieldManager<PathValue<FieldValues, P>> {
    const fieldKey = String(name)
    const existing = this._fields.get(fieldKey) as
      | FieldManager<PathValue<FieldValues, P>>
      | undefined
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
    const hasPending = fieldKey in this._pendingValues
    const hasPendingInitial = fieldKey in this._pendingInitialValues
    const constructorInitial = this._resolveConstructorInitial(fieldKey)
    const hasConstructorInitial = constructorInitial.found

    type V = PathValue<FieldValues, P>
    const seedInitial: V = hasPendingInitial
      ? (this._pendingInitialValues[fieldKey] as V)
      : hasConstructorInitial
        ? (constructorInitial.value as V)
        : (options.defaultValue as V)

    const fieldOptions: FieldOptions<V> = {
      ...options,
      defaultValue: seedInitial,
    }

    const field =
      preferredField ?? new FieldManager<V>(fieldKey, fieldOptions)

    if (preferredField) {
      field.updateOptions(fieldOptions)
      field._replaceInitialValue(seedInitial)
    }

    field._attachFieldsProvider(() => this._getFieldsForValidators())
    this._fields.set(fieldKey, field as FieldManager<any>)
    this._fieldRegistrationCounts.set(fieldKey, 1)

    const unsubscribe = field.subscribe(() => {
      this._requestFormStateUpdate({ skipOnChange: this._isReseeding })
    })
    this._fieldUnsubscribers.set(fieldKey, unsubscribe)

    if (hasPending) {
      field.setValue(this._pendingValues[fieldKey] as V)
      delete this._pendingValues[fieldKey]
    }
    if (hasPendingInitial) {
      delete this._pendingInitialValues[fieldKey]
    }
    if (Object.prototype.hasOwnProperty.call(this._pendingErrors, fieldKey)) {
      field.setError(this._pendingErrors[fieldKey] ?? null)
      delete this._pendingErrors[fieldKey]
    }

    this._events.emit(eventNames.fieldRegistered, fieldKey, field)
    this._requestFormStateUpdate({ skipOnChange: true })

    return field
  }

  unregisterField<P extends Path<FieldValues>>(name: P): void {
    const fieldKey = String(name)
    const field = this._fields.get(fieldKey)
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
    this._fields.delete(fieldKey)
    this._events.emit(eventNames.fieldUnregistered, fieldKey)
    this._requestFormStateUpdate({ skipOnChange: true })
  }

  getField<P extends Path<FieldValues>>(
    name: P,
  ): FieldManager<PathValue<FieldValues, P>> | undefined {
    return this._fields.get(String(name)) as
      | FieldManager<PathValue<FieldValues, P>>
      | undefined
  }

  getAllFields(): FormFields {
    return Object.fromEntries(this._fields)
  }

  getValues(): FieldValues {
    const out: Record<string, any> = {}
    this._fields.forEach((field, path) => {
      setByPath(out, path, field.getValue())
    })
    return out as FieldValues
  }

  /**
   * Apply values to registered fields. Accepts a deep-partial shape —
   * objects are walked recursively until a registered field is found at
   * that path, at which point the whole subtree is handed off. Paths that
   * don't correspond to any registered field are buffered and applied
   * when/if they register.
   */
  setValues(values: DeepPartial<FieldValues>): void {
    this._applyToFields(values as unknown, '', 'setValue')
  }

  /**
   * Re-seed initial (reset) values. Same walk semantics as setValues, but
   * applies to each field's initial value rather than current value. For
   * already-registered fields that have not been edited, the current value
   * is also updated (so the UI reflects the hydration).
   */
  setInitialValues(values: DeepPartial<FieldValues>): void {
    // Merge into stored options so future reset() picks up the new seeds.
    this._options = {
      ...this._options,
      initialValues: this._mergeDeep(this._options.initialValues, values),
    }

    this._isReseeding = true
    try {
      this._batch(() => {
        this._applyToFields(values as unknown, '', 'setInitial')
        this._requestFormStateUpdate({ skipOnChange: true })
      })
    }
    finally {
      this._isReseeding = false
    }
  }

  getErrors(): Record<string, string> {
    const errors: Record<string, string> = {}
    this._fields.forEach((field, path) => {
      const error = field.state.error
      if (error) errors[path] = error
    })
    return errors
  }

  setErrors(errors: Record<string, string | null>): void {
    this._batch(() => {
      Object.keys(errors).forEach((path) => {
        const field = this._fields.get(path)
        if (field) {
          field.setError(errors[path])
          return
        }

        if (errors[path] === null) {
          delete this._pendingErrors[path]
          return
        }

        this._pendingErrors[path] = errors[path]
      })
    })
  }

  async validate(): Promise<boolean> {
    this.setState({ isValidating: true })

    const fields = Array.from(this._fields.values())
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
      this._fields.forEach((field) => field.reset())

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

  private _applyToFields(
    value: unknown,
    prefix: string,
    mode: 'setValue' | 'setInitial',
  ): void {
    // If a field is registered exactly at this prefix, hand off the whole
    // subtree regardless of its shape (so { address: {...} } goes to an
    // 'address' field if one exists).
    if (prefix) {
      const field = this._fields.get(prefix)
      if (field) {
        if (mode === 'setValue') {
          field.setValue(value)
        }
        else {
          field._replaceInitialValue(value)
        }
        return
      }
    }

    if (isPlainObject(value)) {
      for (const [ key, sub ] of Object.entries(value)) {
        const nextPath = prefix ? `${prefix}.${key}` : key
        this._applyToFields(sub, nextPath, mode)
      }
      return
    }

    // Leaf at an unregistered prefix — buffer.
    if (!prefix) return // don't buffer the whole root
    if (mode === 'setValue') {
      this._pendingValues[prefix] = value
    }
    else {
      this._pendingInitialValues[prefix] = value
    }
  }

  private _resolveConstructorInitial(path: string): {
    found: boolean
    value: unknown
  } {
    const initial = this._options.initialValues as Record<string, any> | undefined
    if (!initial) return { found: false, value: undefined }

    const parts = path.split('.')
    let cursor: any = initial
    for (const part of parts) {
      if (cursor === null || typeof cursor !== 'object') {
        return { found: false, value: undefined }
      }
      if (!(part in cursor)) return { found: false, value: undefined }
      cursor = cursor[part]
    }
    return { found: true, value: cursor }
  }

  private _mergeDeep(
    target: any,
    source: any,
  ): any {
    if (!isPlainObject(source)) return source
    const out: Record<string, any> = isPlainObject(target) ? { ...target } : {}
    for (const [ key, val ] of Object.entries(source)) {
      out[key] = isPlainObject(val) ? this._mergeDeep(out[key], val) : val
    }
    return out
  }

  private _updateFormState(opts: { skipOnChange?: boolean } = {}): void {
    const values = this.getValues()
    const errors = this.getErrors()
    const fields = Array.from(this._fields.values())
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
      this._options.onChange?.(values as FieldValues)
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
    this._fields.forEach((field, path) => {
      out[path] = field
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
    this._fields.forEach((field) => field.destroy())
    this._fields.clear()
    this._pendingValues = {}
    this._pendingInitialValues = {}
    this._pendingErrors = {}
    this._pendingFormStateUpdate = null
    this._batchDepth = 0
    this._events.removeAllListeners()
  }
}
