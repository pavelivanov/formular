import equal from 'fast-deep-equal'
import type React from 'react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

import type { FormOptions } from './Form'
import { Form } from './Form'
import type { DeepPartial } from './paths'

const FormContext = createContext<Form<any> | null>(null)

type ProviderProps<FieldValues extends Record<string, any>> = {
  children: React.ReactNode
  /**
   * A caller-controlled `Form` instance to put on context, instead of
   * letting the Provider create (and destroy) its own. When provided, the
   * Provider skips its internal lifecycle management — no setOptions,
   * no setInitialValues re-seed, no destroy on unmount. The caller owns
   * the form's lifetime.
   *
   * Primarily for tests (see `formular/testing`'s `createTestForm`).
   */
  form?: Form<FieldValues>
} & FormOptions<FieldValues>

export function FormContextProvider<FieldValues extends Record<string, any>>(
  props: ProviderProps<FieldValues>,
) {
  if (props.form) {
    return (
      <FormContext.Provider value={props.form}>
        {props.children}
      </FormContext.Provider>
    )
  }
  return <ManagedProvider {...props} />
}

function ManagedProvider<FieldValues extends Record<string, any>>({
  children,
  initialValues,
  onSubmit,
  onSubmitError,
  onChange,
  formId,
}: ProviderProps<FieldValues>) {
  const [ form ] = useState(() => {
    return new Form<FieldValues>({
      formId,
      initialValues,
      onSubmit,
      onSubmitError,
      onChange,
    })
  })

  useEffect(() => {
    form.setOptions({ onSubmit, onSubmitError, onChange })
  }, [ form, onSubmit, onSubmitError, onChange ])

  const didSeedRef = useRef(false)
  const lastInitialRef = useRef(initialValues)
  useEffect(() => {
    if (!didSeedRef.current) {
      didSeedRef.current = true
      lastInitialRef.current = initialValues
      return
    }
    if (equal(lastInitialRef.current, initialValues)) return
    lastInitialRef.current = initialValues
    form.setInitialValues((initialValues ?? {}) as DeepPartial<FieldValues>)
  }, [ form, initialValues ])

  useEffect(() => {
    return () => {
      form.destroy()
    }
  }, [ form ])

  return <FormContext.Provider value={form}>{children}</FormContext.Provider>
}

export function useFormContext<
  T extends Record<string, any> = Record<string, any>,
>(): Form<T> {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('useFormContext must be used within a FormContextProvider')
  }
  return context
}
