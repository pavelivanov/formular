import { useCallback, useMemo, useRef } from 'react'

import type { Form } from './Form'
import { useFieldRegister, useForm } from './hooks'
import type { FieldOptions } from './types'

type AnyForm = Form<Record<string, any>>

export interface FieldArrayItem<Item> {
  /**
   * Stable identity for the React `key` prop — survives inserts, swaps,
   * and moves, so row components don't remount when siblings reorder.
   */
  id: string
  /**
   * Current index of this item. Recomputed on each render; do not rely on
   * it across renders if you need identity — use `id` for that.
   */
  index: number
  value: Item
}

export interface UseFieldArrayReturn<Item> {
  fields: ReadonlyArray<FieldArrayItem<Item>>
  append: (item: Item) => void
  prepend: (item: Item) => void
  insert: (index: number, item: Item) => void
  remove: (index: number) => void
  swap: (a: number, b: number) => void
  move: (from: number, to: number) => void
  replace: (items: ReadonlyArray<Item>) => void
  clear: () => void
}

// Module-local monotonic counter. Combined with a timestamp this gives us
// unique IDs without pulling in a uuid library or assuming crypto.randomUUID
// (which is unavailable on older Node).
let idCounter = 0
const idPrefix = `fa-${Math.random().toString(36).slice(2, 8)}`
const nextId = (): string => `${idPrefix}-${++idCounter}`

/**
 * Manage an array-valued field as a mutable list of items. The array lives
 * as a single `FieldManager<Item[]>` on the form — each operation produces
 * a new array via a functional `setValue`, so concurrent state updates
 * compose correctly.
 *
 * `fields[i].id` is a stable string you can drop straight into
 * `<Row key={field.id} />`. Operations (append/remove/swap/etc.) keep the
 * id-array in sync. External mutations via `form.setValues` that change the
 * array length cause a one-time regeneration of ids for that render, so
 * keys stay in sync but the stability guarantee is lost for that update.
 *
 * This hook deliberately does NOT manage sub-field registrations at
 * `items.<N>.*` paths — if you need per-row field state beyond schema
 * validation, register those fields yourself.
 *
 * For typed paths bound to your form shape, prefer the hook returned by
 * {@link createForm}. This direct hook is the ad-hoc form — pass `Item`
 * explicitly.
 */
export function useFieldArray<Item = any>(
  path: string,
  options?: FieldOptions<Item[]>,
): UseFieldArrayReturn<Item>
export function useFieldArray(
  path: string,
  options: FieldOptions<any[]> = {},
): UseFieldArrayReturn<any> {
  const form = useForm() as AnyForm
  const field = useFieldRegister<any[]>(path, {
    defaultValue: [],
    ...options,
  })

  const items: any[] = Array.isArray(field.state.value) ? field.state.value : []

  // Parallel id array. Reconciled lazily during render so external
  // mutations (form.setValues) that don't go through the hook operations
  // still produce a consistent render.
  const idsRef = useRef<string[]>([])
  if (idsRef.current.length !== items.length) {
    idsRef.current = items.map((_, i) => idsRef.current[i] ?? nextId())
  }
  const ids = idsRef.current

  const fields = useMemo<ReadonlyArray<FieldArrayItem<any>>>(
    () => items.map((value, index) => ({ id: ids[index] as string, index, value })),
    [ items, ids ],
  )

  // Keep a current-items ref so callbacks can compute the right index-
  // shift mapping for reindexing without closing over stale array data.
  const itemsRef = useRef(items)
  itemsRef.current = items

  const reindex = useCallback(
    (mapping: Map<number, number | null>) => {
      form._reindexArrayFields(path, mapping)
    },
    [ form, path ],
  )

  const append = useCallback(
    (item: any) => {
      // No reindex needed — the new index has no sub-fields registered yet.
      idsRef.current = [ ...idsRef.current, nextId() ]
      field.setValue((prev) => [ ...(Array.isArray(prev) ? prev : []), item ])
    },
    [ field ],
  )

  const prepend = useCallback(
    (item: any) => {
      const len = itemsRef.current.length
      const mapping = new Map<number, number | null>()
      for (let i = 0; i < len; i++) mapping.set(i, i + 1)
      reindex(mapping)

      idsRef.current = [ nextId(), ...idsRef.current ]
      field.setValue((prev) => [ item, ...(Array.isArray(prev) ? prev : []) ])
    },
    [ field, reindex ],
  )

  const insert = useCallback(
    (index: number, item: any) => {
      const len = itemsRef.current.length
      const mapping = new Map<number, number | null>()
      for (let i = index; i < len; i++) mapping.set(i, i + 1)
      reindex(mapping)

      const next = [ ...idsRef.current ]
      next.splice(index, 0, nextId())
      idsRef.current = next
      field.setValue((prev) => {
        const arr = Array.isArray(prev) ? [ ...prev ] : []
        arr.splice(index, 0, item)
        return arr
      })
    },
    [ field, reindex ],
  )

  const remove = useCallback(
    (index: number) => {
      const len = itemsRef.current.length
      const mapping = new Map<number, number | null>()
      mapping.set(index, null) // destroy sub-fields at the removed row
      for (let i = index + 1; i < len; i++) mapping.set(i, i - 1)
      reindex(mapping)

      const next = [ ...idsRef.current ]
      next.splice(index, 1)
      idsRef.current = next
      field.setValue((prev) => {
        const arr = Array.isArray(prev) ? [ ...prev ] : []
        arr.splice(index, 1)
        return arr
      })
    },
    [ field, reindex ],
  )

  const swap = useCallback(
    (a: number, b: number) => {
      if (a === b) return
      const mapping = new Map<number, number | null>()
      mapping.set(a, b)
      mapping.set(b, a)
      reindex(mapping)

      const nextIds = [ ...idsRef.current ]
      ;[ nextIds[a], nextIds[b] ] = [ nextIds[b] as string, nextIds[a] as string ]
      idsRef.current = nextIds
      field.setValue((prev) => {
        if (!Array.isArray(prev)) return prev
        const arr = [ ...prev ]
        ;[ arr[a], arr[b] ] = [ arr[b], arr[a] ]
        return arr
      })
    },
    [ field, reindex ],
  )

  const move = useCallback(
    (from: number, to: number) => {
      if (from === to) return
      const mapping = new Map<number, number | null>()
      mapping.set(from, to)
      if (from < to) {
        for (let i = from + 1; i <= to; i++) mapping.set(i, i - 1)
      }
      else {
        for (let i = to; i < from; i++) mapping.set(i, i + 1)
      }
      reindex(mapping)

      const nextIds = [ ...idsRef.current ]
      const [ movedId ] = nextIds.splice(from, 1)
      if (movedId !== undefined) nextIds.splice(to, 0, movedId)
      idsRef.current = nextIds
      field.setValue((prev) => {
        if (!Array.isArray(prev)) return prev
        const arr = [ ...prev ]
        const [ movedItem ] = arr.splice(from, 1)
        arr.splice(to, 0, movedItem)
        return arr
      })
    },
    [ field, reindex ],
  )

  const replace = useCallback(
    (nextItems: ReadonlyArray<any>) => {
      const len = itemsRef.current.length
      const mapping = new Map<number, number | null>()
      for (let i = 0; i < len; i++) mapping.set(i, null)
      reindex(mapping)

      idsRef.current = nextItems.map(() => nextId())
      field.setValue([ ...nextItems ])
    },
    [ field, reindex ],
  )

  const clear = useCallback(() => {
    const len = itemsRef.current.length
    const mapping = new Map<number, number | null>()
    for (let i = 0; i < len; i++) mapping.set(i, null)
    reindex(mapping)

    idsRef.current = []
    field.setValue([])
  }, [ field, reindex ])

  return { fields, append, prepend, insert, remove, swap, move, replace, clear }
}
