import type { StandardSchemaV1 } from './standard-schema'

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
  /**
   * Schema-first validation. Accepts any library that implements the
   * Standard Schema v1 contract (Zod 3.24+, Valibot 0.40+, ArkType, …).
   * Runs BEFORE `validators` — the first issue message becomes the field
   * error, and the validator array is skipped for that run. Value
   * transformations are not applied; use `onSubmit` if you need the
   * parsed value.
   */
  schema?: StandardSchemaV1<any, T>
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
