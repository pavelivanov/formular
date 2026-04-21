// Context and provider
export { FormContextProvider, useFormContext } from './FormContext'
export { FieldManager } from './FieldManager'
export { eventNames, Form } from './Form'

// Hooks
export {
  useField,
  useFieldRegister,
  useForm,
  useFormState,
  useFormValidation,
} from './hooks'

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
export type { DeepPartial, Path, PathValue } from './paths'
