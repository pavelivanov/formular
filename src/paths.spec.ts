import { describe, expect, expectTypeOf, test } from 'vitest'

import { Form } from './Form'
import type { DeepPartial, Path, PathValue } from './paths'
import { isPlainObject, setByPath } from './paths'

describe('paths: type-level', () => {

  test('Path<T> enumerates every dotted path', () => {
    type Values = {
      name: string
      address: {
        street: string
        city: string
        zip: { code: number; country: string }
      }
      tags: string[]
    }

    type AllPaths = Path<Values>

    expectTypeOf<AllPaths>().toEqualTypeOf<
      | 'name'
      | 'address'
      | 'address.street'
      | 'address.city'
      | 'address.zip'
      | 'address.zip.code'
      | 'address.zip.country'
      | 'tags'
    >()
  })

  test('PathValue<T, P> reads the value type at any depth', () => {
    type Values = {
      user: { email: string; age: number }
      tags: string[]
    }

    expectTypeOf<PathValue<Values, 'user'>>().toEqualTypeOf<{
      email: string
      age: number
    }>()
    expectTypeOf<PathValue<Values, 'user.email'>>().toEqualTypeOf<string>()
    expectTypeOf<PathValue<Values, 'user.age'>>().toEqualTypeOf<number>()
    expectTypeOf<PathValue<Values, 'tags'>>().toEqualTypeOf<string[]>()
  })

  test('DeepPartial allows partial shapes at any depth', () => {
    type Values = {
      user: { email: string; age: number }
      tags: string[]
    }

    // Accepted partials — compile-time test.
    const a: DeepPartial<Values> = {}
    const b: DeepPartial<Values> = { user: {} }
    const c: DeepPartial<Values> = { user: { email: 'a@b.com' } }
    const d: DeepPartial<Values> = { tags: [ 'x' ] }
    expect([ a, b, c, d ]).toHaveLength(4)
  })

})

describe('paths: runtime helpers', () => {

  test('setByPath builds nested objects as needed', () => {
    const obj: Record<string, any> = {}
    setByPath(obj, 'a.b.c', 1)
    setByPath(obj, 'a.b.d', 2)
    setByPath(obj, 'a.e', 3)
    setByPath(obj, 'f', 4)
    expect(obj).toEqual({ a: { b: { c: 1, d: 2 }, e: 3 }, f: 4 })
  })

  test('setByPath materialises numeric segments as arrays', () => {
    const obj: Record<string, any> = {}
    setByPath(obj, 'rows.0.name', 'a')
    setByPath(obj, 'rows.2.name', 'c')
    expect(Array.isArray(obj.rows)).toBe(true)
    expect(obj.rows).toEqual([ { name: 'a' }, undefined, { name: 'c' } ])
  })

  test('setByPath does not mutate caller-owned arrays or objects', () => {
    // Regression test for the getValues() bug: when Form.getValues seeded
    // out.rows from a whole-array field and then wrote sub-field paths,
    // setByPath was mutating the live field's array in place.
    const liveArray = [ { name: 'x' }, { name: 'y' } ]
    const liveRow = liveArray[0]!

    const out: Record<string, any> = {}
    setByPath(out, 'rows', liveArray)
    setByPath(out, 'rows.0.name', 'EDITED')
    setByPath(out, 'rows.2.name', 'ADDED')

    expect(liveArray).toHaveLength(2)
    expect(liveArray[0]).toBe(liveRow)
    expect(liveArray[0]?.name).toBe('x')
    expect(liveArray[1]?.name).toBe('y')

    expect(out.rows[0].name).toBe('EDITED')
    expect(out.rows[2].name).toBe('ADDED')
  })

  test('isPlainObject recognises plain objects only', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject({ a: 1 })).toBe(true)
    expect(isPlainObject(Object.create(null))).toBe(true)

    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject(undefined)).toBe(false)
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject(new Date())).toBe(false)
    expect(isPlainObject('a')).toBe(false)
    expect(isPlainObject(1)).toBe(false)
  })

})

describe('Form with nested paths', () => {

  type Contact = {
    name: string
    address: {
      street: string
      city: string
      zip: { code: string }
    }
  }

  test('registers and retrieves fields at nested paths', () => {
    const form = new Form<Contact>({
      initialValues: {
        name: 'Ada',
        address: { street: '10 Main', city: 'NYC', zip: { code: '10001' } },
      },
    })

    const street = form.registerField('address.street')
    const code = form.registerField('address.zip.code')

    expect(street.getValue()).toBe('10 Main')
    expect(code.getValue()).toBe('10001')
  })

  test('getValues() reconstructs the nested shape', () => {
    const form = new Form<Contact>()
    form.registerField('name', { defaultValue: 'Ada' })
    form.registerField('address.street', { defaultValue: '10 Main' })
    form.registerField('address.city', { defaultValue: 'NYC' })
    form.registerField('address.zip.code', { defaultValue: '10001' })

    expect(form.getValues()).toEqual({
      name: 'Ada',
      address: { street: '10 Main', city: 'NYC', zip: { code: '10001' } },
    })
  })

  test('setValues() walks a partial shape down to registered fields', () => {
    const form = new Form<Contact>()
    const street = form.registerField('address.street', { defaultValue: '' })
    const city = form.registerField('address.city', { defaultValue: '' })

    form.setValues({ address: { street: '42 Elm', city: 'Boston' } })

    expect(street.getValue()).toBe('42 Elm')
    expect(city.getValue()).toBe('Boston')
  })

  test('setValues() buffers for fields not yet registered, then hydrates on register', () => {
    const form = new Form<Contact>()
    form.setValues({ address: { street: '42 Elm', zip: { code: '02110' } } })

    const street = form.registerField('address.street', { defaultValue: '' })
    const code = form.registerField('address.zip.code', { defaultValue: '' })

    expect(street.getValue()).toBe('42 Elm')
    expect(code.getValue()).toBe('02110')
  })

  test('setInitialValues() re-seeds nested initials and resets hydrate correctly', () => {
    const form = new Form<Contact>({
      initialValues: { address: { street: 'old' } } as DeepPartial<Contact>,
    })
    const street = form.registerField('address.street', { defaultValue: '' })

    expect(street.getValue()).toBe('old')

    form.setInitialValues({ address: { street: 'new' } })
    expect(street.getValue()).toBe('new')

    street.setValue('edited')
    form.reset()
    expect(street.getValue()).toBe('new')
  })

  test('a whole-object field short-circuits recursion', () => {
    // Registering at 'address' means the field owns the entire subtree;
    // setValues({ address: {...} }) hands off the object instead of walking.
    type LooseContact = {
      address: { street: string; city: string }
    }
    const form = new Form<LooseContact>()
    const whole = form.registerField('address', {
      defaultValue: { street: '', city: '' },
    })

    form.setValues({ address: { street: 'A', city: 'B' } })
    expect(whole.getValue()).toEqual({ street: 'A', city: 'B' })
  })

  test('unregisterField(path) removes by exact path', () => {
    const form = new Form<Contact>()
    form.registerField('address.street', { defaultValue: '' })
    form.registerField('address.city', { defaultValue: '' })

    expect(form.getField('address.street')).toBeDefined()
    form.unregisterField('address.street')
    expect(form.getField('address.street')).toBeUndefined()
    expect(form.getField('address.city')).toBeDefined()
  })

  test('getErrors returns dotted-path keys', async () => {
    const form = new Form<Contact>()
    form.registerField('address.street', {
      required: true,
      defaultValue: '',
    })

    await form.validate()
    expect(form.getErrors()).toEqual({
      'address.street': 'This field is required',
    })
  })

  test('submit() returns both nested values and flat dotted errors', async () => {
    const form = new Form<Contact>()
    form.registerField('name', { defaultValue: 'Ada' })
    form.registerField('address.street', {
      required: true,
      defaultValue: '',
    })

    const result = await form.submit()
    expect(result.isValid).toBe(false)
    expect(result.values).toEqual({ name: 'Ada', address: { street: '' } })
    expect(result.errors).toEqual({
      'address.street': 'This field is required',
    })
  })

})
