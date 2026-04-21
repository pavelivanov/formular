// @vitest-environment jsdom

import { act, render } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, test } from 'vitest'

import { FormContextProvider } from './FormContext'
import type { UseFieldArrayReturn } from './useFieldArray'
import { useFieldArray } from './useFieldArray'
import { useForm } from './hooks'
import type { Form } from './Form'

type Values = {
  tags: string[]
}

type Capture = {
  api: UseFieldArrayReturn<string> | null
  form: Form<Values> | null
}

function TagsHost({ onReady }: { onReady: (capture: Capture) => void }) {
  const form = useForm<Values>()
  const api = useFieldArray<string>('tags', { defaultValue: [] })

  useEffect(() => {
    onReady({ api, form })
  })

  return null
}

function mount(initialValues: Partial<Values> = {}) {
  const capture: Capture = { api: null, form: null }
  render(
    <FormContextProvider<Values> initialValues={initialValues}>
      <TagsHost onReady={(c) => Object.assign(capture, c)} />
    </FormContextProvider>,
  )
  return capture
}

const getApi = (capture: Capture) => {
  if (!capture.api) throw new Error('useFieldArray did not mount')
  return capture.api
}

describe('useFieldArray', () => {

  test('starts empty when no initial value is provided', () => {
    const c = mount()
    expect(getApi(c).fields).toEqual([])
  })

  test('hydrates from initialValues', () => {
    const c = mount({ tags: [ 'a', 'b', 'c' ] })
    expect(getApi(c).fields.map((f) => f.value)).toEqual([ 'a', 'b', 'c' ])
    expect(getApi(c).fields.every((f) => typeof f.id === 'string')).toBe(true)
  })

  test('append adds to the end and keeps existing ids stable', () => {
    const c = mount({ tags: [ 'a' ] })
    const firstId = getApi(c).fields[0]!.id

    act(() => { getApi(c).append('b') })

    expect(getApi(c).fields.map((f) => f.value)).toEqual([ 'a', 'b' ])
    expect(getApi(c).fields[0]!.id).toBe(firstId)
  })

  test('prepend adds to the start', () => {
    const c = mount({ tags: [ 'b' ] })
    act(() => { getApi(c).prepend('a') })
    expect(getApi(c).fields.map((f) => f.value)).toEqual([ 'a', 'b' ])
  })

  test('insert places item at a specific index', () => {
    const c = mount({ tags: [ 'a', 'c' ] })
    act(() => { getApi(c).insert(1, 'b') })
    expect(getApi(c).fields.map((f) => f.value)).toEqual([ 'a', 'b', 'c' ])
  })

  test('remove drops item at index and keeps other ids stable', () => {
    const c = mount({ tags: [ 'a', 'b', 'c' ] })
    const [ , , idOfC ] = getApi(c).fields.map((f) => f.id)

    act(() => { getApi(c).remove(1) })

    expect(getApi(c).fields.map((f) => f.value)).toEqual([ 'a', 'c' ])
    // After removing index 1, the former third item slides to index 1 but
    // keeps its original id — that's the whole point of stable keys.
    expect(getApi(c).fields[1]!.id).toBe(idOfC)
  })

  test('swap exchanges two positions and swaps their ids too', () => {
    const c = mount({ tags: [ 'a', 'b', 'c' ] })
    const [ idA, , idC ] = getApi(c).fields.map((f) => f.id)

    act(() => { getApi(c).swap(0, 2) })

    expect(getApi(c).fields.map((f) => f.value)).toEqual([ 'c', 'b', 'a' ])
    expect(getApi(c).fields[0]!.id).toBe(idC)
    expect(getApi(c).fields[2]!.id).toBe(idA)
  })

  test('move relocates item and ids follow', () => {
    const c = mount({ tags: [ 'a', 'b', 'c', 'd' ] })
    const [ , , idC ] = getApi(c).fields.map((f) => f.id)

    act(() => { getApi(c).move(2, 0) })

    expect(getApi(c).fields.map((f) => f.value)).toEqual([ 'c', 'a', 'b', 'd' ])
    expect(getApi(c).fields[0]!.id).toBe(idC)
  })

  test('replace regenerates ids for the new collection', () => {
    const c = mount({ tags: [ 'a', 'b' ] })
    const originalIds = getApi(c).fields.map((f) => f.id)

    act(() => { getApi(c).replace([ 'x', 'y', 'z' ]) })

    const nextIds = getApi(c).fields.map((f) => f.id)
    expect(getApi(c).fields.map((f) => f.value)).toEqual([ 'x', 'y', 'z' ])
    expect(nextIds.every((id) => !originalIds.includes(id))).toBe(true)
  })

  test('clear empties the array', () => {
    const c = mount({ tags: [ 'a', 'b' ] })
    act(() => { getApi(c).clear() })
    expect(getApi(c).fields).toEqual([])
  })

  test('external form.setValues reconciles ids to match new length', () => {
    const c = mount({ tags: [ 'a' ] })
    const form = c.form!

    act(() => { form.setValues({ tags: [ 'x', 'y', 'z' ] }) })

    expect(getApi(c).fields.map((f) => f.value)).toEqual([ 'x', 'y', 'z' ])
    expect(getApi(c).fields).toHaveLength(3)
    expect(new Set(getApi(c).fields.map((f) => f.id)).size).toBe(3)
  })

  test('operations are no-ops for trivial inputs (swap a===b, move from===to)', () => {
    const c = mount({ tags: [ 'a', 'b' ] })
    const snapshot = getApi(c).fields.map((f) => ({ id: f.id, value: f.value }))

    act(() => {
      getApi(c).swap(0, 0)
      getApi(c).move(1, 1)
    })

    const after = getApi(c).fields.map((f) => ({ id: f.id, value: f.value }))
    expect(after).toEqual(snapshot)
  })

})
