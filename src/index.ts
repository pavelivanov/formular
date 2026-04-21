// Context and provider
export { FormContextProvider, useFormContext } from './FormContext'
export { FieldManager } from './FieldManager'
export { eventNames, Form } from './Form'
export { createForm } from './createForm'
export type { FormOf, TypedForm } from './createForm'

// Hooks
export {
  useField,
  useFieldRegister,
  useForm,
  useFormState,
  useFormValidation,
} from './hooks'
export { useFieldArray } from './useFieldArray'
export type { FieldArrayItem, UseFieldArrayReturn } from './useFieldArray'

// Validators
export {
  asyncValidator,
  compose,
  confirmField,
  creditCard,
  dateFormat,
  email,
  max,
  maxLength,
  min,
  minAge,
  minLength,
  numeric,
  pattern,
  phoneNumber,
  url,
} from './validators'

// Components
export { FieldLabel } from './FieldLabel'
export { FieldError } from './FieldError'

export type {
  FormEventMap,
  FormEventName,
  FormFields,
  FormOptions,
  SubmitErrorContext,
  SubmitResult,
} from './Form'
export type {
  FieldOptions,
  FieldState,
  FormState,
  IFieldManager,
  ReadonlyField,
  Validator,
} from './types'
export type {
  StandardSchemaV1,
  StandardSchemaV1Issue,
  StandardSchemaV1Result,
} from './standard-schema'
export type { ArrayPath, DeepPartial, Path, PathValue } from './paths'
