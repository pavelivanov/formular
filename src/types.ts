export interface ReadonlyField<T = unknown> {
  name: string
  state: Readonly<FieldState<T>>
  getValue: () => T
}

export type Validator<T = unknown> = (
  value: T,
  allFields: Record<string, ReadonlyField<unknown>>,
) => Promise<string | null> | string | null

export interface FieldState<T = unknown> {
  value: T
  error: string | null
  isChanged: boolean
  isValidating: boolean
  isValidated: boolean
  isValid: boolean
  isTouched: boolean
}

export interface FieldOptions<T = unknown> {
  defaultValue?: T
  validators?: Validator<T>[]
  validationDelay?: number
  required?: boolean
  readOnly?: boolean
  emptyCheckFn?(value: T): boolean
}

export interface FormState {
  isValid: boolean
  isChanged: boolean
  isValidating: boolean
  isSubmitting: boolean
  isSubmitted: boolean
  values: Record<string, unknown>
  errors: Record<string, string>
}

export interface IFieldManager<T = unknown> {
  name: string
  state: Readonly<FieldState<T>>
  options: Readonly<FieldOptions<T>>
  setValue: (value: T | ((prevState: T) => T)) => void
  getValue: () => T
  reset: () => void
  validate: () => Promise<string | null>
  setError: (error: string | null) => void
  clearError: () => void
  markAsTouched: () => void
  markAsChanged: () => void
  subscribe: (callback: (state: FieldState<T>) => void) => () => void
}
