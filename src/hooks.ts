import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import { FieldManager } from './FieldManager'
import type { Form } from './Form'
import { eventNames } from './Form'
import { useFormContext } from './FormContext'
import type { FieldOptions } from './types'

const pendingFieldsByForm = new WeakMap<Form<any>, Map<string, FieldManager<any>>>()

function getOrCreateField(
  form: Form<any>,
  name: string,
  options: FieldOptions<any>,
): FieldManager<any> {
  const existing = form.getField<any>(name)
  if (existing) {
    return existing
  }

  let pendingByName = pendingFieldsByForm.get(form)
  if (!pendingByName) {
    pendingByName = new Map()
    pendingFieldsByForm.set(form, pendingByName)
  }

  const pending = pendingByName.get(name)
  if (pending) {
    pending.updateOptions(options)
    return pending
  }

  const created = new FieldManager<any>(name, options)
  pendingByName.set(name, created)
  return created
}

function clearPendingField(form: Form<any>, name: string): void {
  const pendingByName = pendingFieldsByForm.get(form)
  if (!pendingByName) return

  pendingByName.delete(name)
  if (pendingByName.size === 0) {
    pendingFieldsByForm.delete(form)
  }
}

export function useForm<FieldValues extends Record<string, any>>(): Form<FieldValues> {
  return useFormContext()
}

export function useFormState() {
  const form = useForm()
  const subscribe = useCallback(
    (onStoreChange: () => void) => form.on(eventNames.stateChange, onStoreChange),
    [ form ],
  )
  const getSnapshot = useCallback(() => form.state, [ form ])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * Register a field on the ambient form.
 *
 * Prefer the first overload — pass your form's value type as the generic
 * argument so the field `name` is constrained to `keyof FieldValues` and the
 * returned `FieldManager` is typed as `FieldManager<FieldValues[K]>`:
 *
 * ```ts
 * const field = useFieldRegister<BrandFormFields>('name', { required: true });
 * // field: FieldManager<BrandFormFields['name']>
 * ```
 *
 * The second overload (raw value type) is kept for cases where a field
 * exists outside a typed form contract — e.g. ad-hoc drawers.
 */
export function useFieldRegister<
  FieldValues extends Record<string, any>,
  K extends Extract<keyof FieldValues, string> = Extract<keyof FieldValues, string>,
>(name: K, options?: FieldOptions<FieldValues[K]>): FieldManager<FieldValues[K]>
export function useFieldRegister<T = any>(
  name: string,
  options?: FieldOptions<T>,
): FieldManager<T>
export function useFieldRegister(
  name: string,
  options: FieldOptions<any> = {},
): FieldManager<any> {
  const form = useForm()
  const field = getOrCreateField(form, name, options)

  useEffect(() => {
    form.registerField(name, options, field)
    clearPendingField(form, name)

    return () => {
      form.unregisterField(name)
      if (!form.getField<any>(name)) {
        clearPendingField(form, name)
      }
    }
  }, [ form, name, field ])

  useEffect(() => {
    field.updateOptions(options)
  })

  useFieldUpdates(field)

  return field
}

function useFieldUpdates(field: FieldManager<any> | undefined) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!field) return () => {}
      return field.subscribe(() => onStoreChange())
    },
    [ field ],
  )
  const getSnapshot = useCallback(() => field?.state, [ field ])
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useField<T = any>(name: string): FieldManager<T> | undefined {
  const form = useForm()
  const [ field, setField ] = useState<FieldManager<T> | undefined>(() =>
    form.getField<any>(name),
  )
  useFieldUpdates(field)

  useEffect(() => {
    const syncField = () => {
      const next = form.getField<any>(name)
      setField((prev) => (prev === next ? prev : next))
    }

    syncField()

    const handleRegistered = (fieldName: string) => {
      if (fieldName === name) syncField()
    }

    const handleUnregistered = (fieldName: string) => {
      if (fieldName === name) {
        setField((prev) => (prev === undefined ? prev : undefined))
      }
    }

    form.on(eventNames.fieldRegistered, handleRegistered)
    form.on(eventNames.fieldUnregistered, handleUnregistered)

    return () => {
      form.off(eventNames.fieldRegistered, handleRegistered)
      form.off(eventNames.fieldUnregistered, handleUnregistered)
    }
  }, [ form, name ])

  return field
}

export function useFormValidation() {
  const form = useForm()

  const validate = useCallback(async () => {
    return await form.validate()
  }, [ form ])

  const submit = useCallback(async () => {
    return await form.submit()
  }, [ form ])

  const reset = useCallback(() => {
    form.reset()
  }, [ form ])

  return {
    validate,
    submit,
    reset,
  }
}
