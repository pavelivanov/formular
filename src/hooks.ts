import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import { FieldManager } from './FieldManager'
import type { Form } from './Form'
import { eventNames } from './Form'
import { useFormContext } from './FormContext'
import type { FieldOptions } from './types'

// Loose form type used for internal, already-erased hook plumbing.
// `Path<Record<string, any>>` collapses to `string`, so getField/registerField
// accept any string path inside the hook bodies without forcing users to
// downgrade their typed form at the call site.
type AnyForm = Form<Record<string, any>>

const pendingFieldsByForm = new WeakMap<AnyForm, Map<string, FieldManager<any>>>()

function getOrCreateField(
  form: AnyForm,
  name: string,
  options: FieldOptions<any>,
): FieldManager<any> {
  const existing = form.getField(name)
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

function clearPendingField(form: AnyForm, name: string): void {
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
 * For fully-typed paths and inferred value types, prefer the hooks
 * returned by {@link createForm} — TypeScript's partial-explicit-generic
 * inference doesn't narrow literal paths here when both `FieldValues`
 * and the path generic are in play.
 *
 * This direct hook is the "ad-hoc" escape hatch: pass a `T` for the
 * field's value type; the `name` is a plain string.
 *
 * ```ts
 * const field = useFieldRegister<string>('ad-hoc-field')
 * ```
 */
export function useFieldRegister<T = any>(
  name: string,
  options?: FieldOptions<T>,
): FieldManager<T>
export function useFieldRegister(
  name: string,
  options: FieldOptions<any> = {},
): FieldManager<any> {
  const form = useForm() as AnyForm
  const field = getOrCreateField(form, name, options)

  useEffect(() => {
    form.registerField(name, options, field)
    clearPendingField(form, name)

    return () => {
      // Pass `field` so an out-of-order cleanup with a stale name closure
      // doesn't destroy an unrelated field that was moved to this path by
      // a concurrent useFieldArray reindex.
      form.unregisterField(name, field)
      if (!form.getField(name)) {
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
    (form as AnyForm).getField(name),
  )
  useFieldUpdates(field)

  useEffect(() => {
    const syncField = () => {
      const next = (form as AnyForm).getField(name)
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
