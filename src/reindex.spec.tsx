// @vitest-environment jsdom

import { act, render } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, test, vi } from 'vitest'

import { FormContextProvider } from './FormContext'
import type { UseFieldArrayReturn } from './useFieldArray'
import { useFieldArray } from './useFieldArray'
import { useFieldRegister, useForm } from './hooks'
import { Form, eventNames } from './Form'

type Row = { name: string; notes: string }
type Values = { rows: Row[] }

// `form` uses `Record<string, any>` so `Path<T>` collapses to `string` —
// tests can poke at dynamic sub-field paths like `rows.2.name` without
// fighting the typed Path<T>. The typed API goes through
// `createForm<T>()` elsewhere.
type Capture = {
  api: UseFieldArrayReturn<Row> | null
  form: Form<Record<string, any>> | null
}

function mount(initialValues: Partial<Values> = {}): Capture {
  const capture: Capture = { api: null, form: null }

  function Host() {
    const form = useForm<Values>()
    const api = useFieldArray<Row>('rows', { defaultValue: [] })

    useEffect(() => {
      Object.assign(capture, { api, form })
    })

    return (
      <>
        {api.fields.map((item) => (
          <RowFields key={item.id} index={item.index} />
        ))}
      </>
    )
  }

  render(
    <FormContextProvider<Values> initialValues={initialValues}>
      <Host />
    </FormContextProvider>,
  )

  return capture
}

function RowFields({ index }: { index: number }) {
  const nameField = useFieldRegister<string>(`rows.${index}.name`, { defaultValue: '' })
  const notesField = useFieldRegister<string>(`rows.${index}.notes`, { defaultValue: '' })
  return (
    <>
      <input data-testid={`row-${index}-name`} value={nameField.state.value ?? ''} readOnly />
      <input data-testid={`row-${index}-notes`} value={notesField.state.value ?? ''} readOnly />
    </>
  )
}

// Helper — picks the api + form out of the capture; throws a useful message
// if Host hasn't mounted yet (should never happen with synchronous render).
const needs = (c: Capture) => {
  if (!c.api || !c.form) throw new Error('Host not mounted')
  return { api: c.api, form: c.form }
}

describe('useFieldArray reindexing of sub-fields', () => {

  test('remove(i) destroys row i sub-fields and shifts later rows down', async () => {
    const c = mount({ rows: [ { name: 'a', notes: '' }, { name: 'b', notes: '' }, { name: 'c', notes: '' } ] })
    const { api, form } = needs(c)

    // Seed some per-row field state that should carry.
    act(() => {
      form.getField('rows.1.name')?.setValue('BEE')
      form.getField('rows.2.notes')?.setValue('ccc')
    })

    expect(form.getField('rows.1.name')?.getValue()).toBe('BEE')
    expect(form.getField('rows.2.notes')?.getValue()).toBe('ccc')

    await act(async () => {
      api.remove(0)
    })

    expect(form.getField('rows.0.name')?.getValue()).toBe('BEE')
    expect(form.getField('rows.1.notes')?.getValue()).toBe('ccc')
  })

  test('insert(i, item) shifts existing rows >= i up by one', async () => {
    const c = mount({ rows: [ { name: 'x', notes: '' }, { name: 'y', notes: '' } ] })
    const { api, form } = needs(c)

    act(() => {
      form.getField('rows.0.name')?.setValue('XX')
      form.getField('rows.1.name')?.setValue('YY')
    })

    await act(async () => {
      api.insert(1, { name: '', notes: '' })
    })

    // Row 0 kept its state; row 1 is the new empty one; row 2 is the former row 1.
    expect(form.getField('rows.0.name')?.getValue()).toBe('XX')
    expect(form.getField('rows.2.name')?.getValue()).toBe('YY')
  })

  test('prepend(item) shifts every row up by one', async () => {
    const c = mount({ rows: [ { name: 'x', notes: '' }, { name: 'y', notes: '' } ] })
    const { api, form } = needs(c)

    act(() => {
      form.getField('rows.0.notes')?.setValue('first-notes')
    })

    await act(async () => {
      api.prepend({ name: '', notes: '' })
    })

    expect(form.getField('rows.1.notes')?.getValue()).toBe('first-notes')
    expect(form.getField('rows.0.notes')?.getValue()).toBe('')
  })

  test('swap(a, b) exchanges sub-field states without losing them', async () => {
    const c = mount({
      rows: [ { name: 'a', notes: '' }, { name: 'b', notes: '' }, { name: 'c', notes: '' } ],
    })
    const { api, form } = needs(c)

    act(() => {
      form.getField('rows.0.name')?.setValue('A!')
      form.getField('rows.2.name')?.setValue('C!')
    })

    await act(async () => {
      api.swap(0, 2)
    })

    expect(form.getField('rows.0.name')?.getValue()).toBe('C!')
    expect(form.getField('rows.2.name')?.getValue()).toBe('A!')
  })

  test('move(from, to) relocates sub-fields following the item', async () => {
    const c = mount({
      rows: [
        { name: 'a', notes: '' },
        { name: 'b', notes: '' },
        { name: 'c', notes: '' },
        { name: 'd', notes: '' },
      ],
    })
    const { api, form } = needs(c)

    act(() => {
      form.getField('rows.2.name')?.setValue('CEE')
    })

    await act(async () => {
      api.move(2, 0)
    })

    // 'CEE' rode along with item at index 2 → now index 0.
    expect(form.getField('rows.0.name')?.getValue()).toBe('CEE')
  })

  test('remove destroys the renamed FieldManager instance', async () => {
    const c = mount({ rows: [ { name: 'a', notes: '' }, { name: 'b', notes: '' } ] })
    const { api, form } = needs(c)

    const row1Field = form.getField('rows.1.name')
    expect(row1Field).toBeDefined()

    await act(async () => {
      api.remove(1)
    })

    expect(form.getField('rows.1.name')).toBeUndefined()
    // The destroyed instance should no longer have a _validationSeq incrementing etc.
    // We can't poke internals from tests, so assert it's gone from the map.
  })

  test('replace(items) destroys all old sub-fields and starts fresh', async () => {
    const c = mount({ rows: [ { name: 'a', notes: '' }, { name: 'b', notes: '' } ] })
    const { api, form } = needs(c)

    act(() => {
      form.getField('rows.0.name')?.setValue('X')
    })

    const oldRow0Field = form.getField('rows.0.name')
    expect(oldRow0Field?.getValue()).toBe('X')

    await act(async () => {
      api.replace([ { name: 'new', notes: '' } ])
    })

    // The original FieldManager for row 0 is destroyed; the row slot has a
    // fresh instance (not the one that held 'X'). Row 1 is gone entirely.
    const freshRow0Field = form.getField('rows.0.name')
    expect(freshRow0Field).toBeDefined()
    expect(freshRow0Field).not.toBe(oldRow0Field)
    expect(form.getField('rows.1.name')).toBeUndefined()
  })

  test('clear() removes every sub-field', async () => {
    const c = mount({ rows: [ { name: 'a', notes: '' }, { name: 'b', notes: '' } ] })
    const { api, form } = needs(c)

    await act(async () => {
      api.clear()
    })

    expect(form.getField('rows.0.name')).toBeUndefined()
    expect(form.getField('rows.1.name')).toBeUndefined()
  })

  test('field renamed event fires for every moved sub-field', async () => {
    const c = mount({
      rows: [ { name: 'a', notes: '' }, { name: 'b', notes: '' }, { name: 'c', notes: '' } ],
    })
    const { api, form } = needs(c)

    const renamed = vi.fn()
    form.on(eventNames.fieldRenamed, renamed)

    await act(async () => {
      api.remove(0)
    })

    const calls = renamed.mock.calls.map((args) => `${args[0]}->${args[1]}`).sort()
    // rows.1.* -> rows.0.*, rows.2.* -> rows.1.* (name and notes each)
    expect(calls).toEqual([
      'rows.1.name->rows.0.name',
      'rows.1.notes->rows.0.notes',
      'rows.2.name->rows.1.name',
      'rows.2.notes->rows.1.notes',
    ])
  })

  test('re-registration after reindex does not double-count', async () => {
    // Consumer useEffect cleanup fires with the OLD path (which is gone after
    // rename), then re-fires with the NEW path. registerField should see the
    // renamed field at the new path with count 0 → bump to 1, not 2.
    const c = mount({ rows: [ { name: 'a', notes: '' }, { name: 'b', notes: '' } ] })
    const { api, form } = needs(c)

    await act(async () => {
      api.remove(0)
    })

    // One consumer registered rows.0.name; count must be exactly 1.
    // Unregister once — the field should go away cleanly.
    const before = form.getField('rows.0.name')
    expect(before).toBeDefined()

    // Direct introspection via the form's getAllFields keys: after one unregister
    // of the single consumer, the field should be gone.
    form.unregisterField('rows.0.name')
    expect(form.getField('rows.0.name')).toBeUndefined()
  })

})
