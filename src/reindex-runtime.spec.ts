import { describe, expect, test } from 'vitest'

import { Form } from './Form'

// Loose shape for tests that poke at dynamic array sub-paths — typed
// forms route through `createForm<T>()` in production.
type Values = Record<string, any>

describe('Form._reindexArrayFields (pure runtime)', () => {

  test('destroys fields at indexes mapped to null', () => {
    const form = new Form<Values>({
      initialValues: { rows: [ { name: 'a', notes: '' }, { name: 'b', notes: '' } ] },
    })

    form.registerField('rows.0.name', { defaultValue: '' })
    form.registerField('rows.0.notes', { defaultValue: '' })
    form.registerField('rows.1.name', { defaultValue: '' })
    form.registerField('rows.1.notes', { defaultValue: '' })

    // All destroyed
    const mapping = new Map<number, number | null>([ [ 0, null ], [ 1, null ] ])
    form._reindexArrayFields('rows', mapping)

    expect(form.getField('rows.0.name')).toBeUndefined()
    expect(form.getField('rows.0.notes')).toBeUndefined()
    expect(form.getField('rows.1.name')).toBeUndefined()
    expect(form.getField('rows.1.notes')).toBeUndefined()
  })

  test('renames fields according to mapping', () => {
    const form = new Form<Values>()

    form.registerField('rows.0.name', { defaultValue: '' })
    form.registerField('rows.1.name', { defaultValue: '' })

    form.getField('rows.0.name')?.setValue('FIRST')
    form.getField('rows.1.name')?.setValue('SECOND')

    // 0 → 1, 1 → 2
    const mapping = new Map<number, number | null>([ [ 0, 1 ], [ 1, 2 ] ])
    form._reindexArrayFields('rows', mapping)

    expect(form.getField('rows.0.name')).toBeUndefined()
    expect(form.getField('rows.1.name')?.getValue()).toBe('FIRST')
    expect(form.getField('rows.2.name')?.getValue()).toBe('SECOND')
  })

  test('swap(0, 1) exchanges field paths atomically', () => {
    const form = new Form<Values>()

    form.registerField('rows.0.name', { defaultValue: '' })
    form.registerField('rows.1.name', { defaultValue: '' })

    form.getField('rows.0.name')?.setValue('A')
    form.getField('rows.1.name')?.setValue('B')

    const mapping = new Map<number, number | null>([ [ 0, 1 ], [ 1, 0 ] ])
    form._reindexArrayFields('rows', mapping)

    expect(form.getField('rows.0.name')?.getValue()).toBe('B')
    expect(form.getField('rows.1.name')?.getValue()).toBe('A')
  })

})
