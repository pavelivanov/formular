// @vitest-environment jsdom

import { render } from '@testing-library/react'
import { describe, expect, expectTypeOf, test } from 'vitest'

import { createForm } from './createForm'
import type { FieldManager } from './FieldManager'
import type { UseFieldArrayReturn } from './useFieldArray'

type Contact = {
  name: string
  address: { street: string; zip: string }
  tags: string[]
}

// Module-scope factory — exactly how consumers are expected to use it.
const contact = createForm<Contact>()

describe('createForm: typing', () => {

  test('useFieldRegister returns FieldManager narrowed to PathValue', () => {
    type NameField = ReturnType<typeof contact.useFieldRegister<'name'>>
    type StreetField = ReturnType<typeof contact.useFieldRegister<'address.street'>>
    type WholeAddressField = ReturnType<typeof contact.useFieldRegister<'address'>>

    expectTypeOf<NameField>().toEqualTypeOf<FieldManager<string>>()
    expectTypeOf<StreetField>().toEqualTypeOf<FieldManager<string>>()
    expectTypeOf<WholeAddressField>().toEqualTypeOf<
      FieldManager<{ street: string; zip: string }>
    >()
  })

  test('useFieldArray returns UseFieldArrayReturn narrowed to item type', () => {
    type TagsApi = ReturnType<typeof contact.useFieldArray<'tags'>>
    expectTypeOf<TagsApi>().toEqualTypeOf<UseFieldArrayReturn<string>>()
  })

  test('useField typed read-only subscription', () => {
    type TagsField = ReturnType<typeof contact.useField<'tags'>>
    expectTypeOf<TagsField>().toEqualTypeOf<FieldManager<string[]> | undefined>()
  })

})

describe('createForm: runtime', () => {

  test('returned hooks work end-to-end inside FormContextProvider', () => {
    let observed: {
      name: string
      street: string
      tagsLength: number
    } | null = null

    function NameField() {
      const field = contact.useFieldRegister('name', { required: true })
      return <input data-testid="name-input" value={field.state.value ?? ''} readOnly />
    }

    function StreetField() {
      const field = contact.useFieldRegister('address.street')
      return <input data-testid="street-input" value={field.state.value ?? ''} readOnly />
    }

    function TagsObserver() {
      const { fields } = contact.useFieldArray('tags')
      observed = {
        name: '',
        street: '',
        tagsLength: fields.length,
      }
      return null
    }

    render(
      <contact.FormContextProvider
        initialValues={{
          name: 'Ada',
          address: { street: '10 Main', zip: '10001' },
          tags: [ 'x', 'y' ],
        }}
      >
        <NameField />
        <StreetField />
        <TagsObserver />
      </contact.FormContextProvider>,
    )

    expect(observed).toEqual({ name: '', street: '', tagsLength: 2 })
  })

})
