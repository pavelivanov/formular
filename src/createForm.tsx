import type React from 'react'

import { FieldManager } from './FieldManager'
import type { Form, FormOptions } from './Form'
import { FormContextProvider as BaseProvider } from './FormContext'
import {
  useField as useFieldBase,
  useFieldRegister as useFieldRegisterBase,
  useForm as useFormBase,
  useFormState,
  useFormValidation,
} from './hooks'
import type { ArrayPath, Path, PathValue } from './paths'
import type { FieldOptions, FormState } from './types'
import { useFieldArray as useFieldArrayBase } from './useFieldArray'
import type { UseFieldArrayReturn } from './useFieldArray'

type ArrayElement<T> = T extends ReadonlyArray<infer U> ? U : never

/**
 * Typed hooks bound to a specific form shape.
 *
 * TypeScript's partial-explicit-generic inference doesn't narrow literal
 * path arguments when only `FieldValues` is supplied on a hook. This
 * factory closes `FieldValues` over a small namespace of hooks, so only
 * one type parameter is in play at call-sites and the literal `name`
 * infers cleanly:
 *
 * ```ts
 * const form = createForm<ContactForm>()
 *
 * function NameField() {
 *   const field = form.useFieldRegister('name')           // FieldManager<string>
 *   const street = form.useFieldRegister('address.street') // FieldManager<string>
 *   const { fields, append } = form.useFieldArray('tags')  // Item = string
 * }
 * ```
 *
 * Call once per form shape at module scope. The returned object is stable
 * across renders; each hook on it is the underlying runtime hook with
 * tighter typing applied via a cast.
 */
export function createForm<FieldValues extends Record<string, any>>() {
  type FV = FieldValues

  const useFieldRegister = useFieldRegisterBase as unknown as <
    const P extends Path<FV>,
  >(
    name: P,
    options?: FieldOptions<PathValue<FV, P>>,
  ) => FieldManager<PathValue<FV, P>>

  const useFieldArray = useFieldArrayBase as unknown as <
    const P extends ArrayPath<FV>,
  >(
    path: P,
    options?: FieldOptions<PathValue<FV, P>>,
  ) => UseFieldArrayReturn<ArrayElement<PathValue<FV, P>>>

  const useField = useFieldBase as unknown as <const P extends Path<FV>>(
    path: P,
  ) => FieldManager<PathValue<FV, P>> | undefined

  const useForm = () => useFormBase<FV>()

  const FormContextProvider = BaseProvider as unknown as (
    props: { children: React.ReactNode } & FormOptions<FV>,
  ) => React.ReactElement

  return {
    FormContextProvider,
    useForm,
    useFormContext: useForm,
    useFormState: useFormState as () => FormState,
    useFormValidation,
    useFieldRegister,
    useFieldArray,
    useField,
  }
}

export type TypedForm<FieldValues extends Record<string, any>> = ReturnType<
  typeof createForm<FieldValues>
>

// Re-export the runtime Form class type parameter so callers can type a
// captured `Form` instance without reaching into Form directly.
export type FormOf<T extends TypedForm<any>> = T extends TypedForm<infer V>
  ? Form<V>
  : never
