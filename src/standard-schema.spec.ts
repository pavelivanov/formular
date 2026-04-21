import { describe, expect, test, vi } from 'vitest'

import { FieldManager } from './FieldManager'
import { Form } from './Form'
import type { StandardSchemaV1 } from './standard-schema'

// Minimal inline schema constructors that satisfy StandardSchemaV1. These
// stand in for Zod/Valibot/ArkType in tests so the suite stays free of
// schema-library devDeps.

function syncSchema<T>(
  check: (value: unknown) => { ok: true; value: T } | { ok: false; message: string },
): StandardSchemaV1<unknown, T> {
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate(value) {
        const result = check(value)
        if (result.ok) return { value: result.value }
        return { issues: [ { message: result.message } ] }
      },
    },
  }
}

function asyncSchema<T>(
  check: (value: unknown) => Promise<{ ok: true; value: T } | { ok: false; message: string }>,
): StandardSchemaV1<unknown, T> {
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      async validate(value) {
        const result = await check(value)
        if (result.ok) return { value: result.value }
        return { issues: [ { message: result.message } ] }
      },
    },
  }
}

const requiredString = syncSchema<string>((value) => {
  if (typeof value !== 'string' || value.length === 0) {
    return { ok: false, message: 'String required' }
  }
  return { ok: true, value }
})

const emailSchema = syncSchema<string>((value) => {
  if (typeof value !== 'string') return { ok: false, message: 'Must be a string' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { ok: false, message: 'Invalid email' }
  }
  return { ok: true, value }
})

describe('Standard Schema adapter', () => {

  test('field-level sync schema reports the first issue message', async () => {
    const field = new FieldManager<string>('email', { schema: emailSchema })

    await expect(field.validate()).resolves.toBe('Must be a string')

    field.setValue('not-an-email')
    await expect(field.validate()).resolves.toBe('Invalid email')

    field.setValue('ok@example.com')
    await expect(field.validate()).resolves.toBeNull()
    expect(field.state.isValid).toBe(true)
  })

  test('async schema is awaited and updates field state on resolution', async () => {
    const schema = asyncSchema<string>(async (value) => {
      await new Promise((r) => setTimeout(r, 10))
      if (value === 'taken') return { ok: false, message: 'Username taken' }
      return { ok: true, value: value as string }
    })

    const field = new FieldManager<string>('username', {
      schema,
      defaultValue: 'taken',
    })

    await expect(field.validate()).resolves.toBe('Username taken')
    expect(field.state.error).toBe('Username taken')

    field.setValue('available')
    await expect(field.validate()).resolves.toBeNull()
  })

  test('schema runs before validators; validators skipped when schema fails', async () => {
    const validatorSpy = vi.fn(() => 'validator-error')

    const field = new FieldManager<string>('email', {
      schema: emailSchema,
      validators: [ validatorSpy ],
    })

    field.setValue('bad')
    await expect(field.validate()).resolves.toBe('Invalid email')
    expect(validatorSpy).not.toHaveBeenCalled()

    field.setValue('ok@example.com')
    await expect(field.validate()).resolves.toBe('validator-error')
    expect(validatorSpy).toHaveBeenCalledTimes(1)
  })

  test('required check runs before schema', async () => {
    const schemaSpy = vi.fn((_value: unknown) => ({ value: '' }))
    const schema: StandardSchemaV1<unknown, string> = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: schemaSpy,
      },
    }

    const field = new FieldManager<string>('name', {
      schema,
      required: true,
      defaultValue: '',
    })

    await expect(field.validate()).resolves.toBe('This field is required')
    expect(schemaSpy).not.toHaveBeenCalled()
  })

  test('multi-issue schema picks the first message', async () => {
    const schema: StandardSchemaV1<unknown, string> = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: () => ({
          issues: [
            { message: 'first issue' },
            { message: 'second issue' },
            { message: 'third issue' },
          ],
        }),
      },
    }

    const field = new FieldManager<string>('x', { schema })
    await expect(field.validate()).resolves.toBe('first issue')
  })

  test('integrates with Form.submit via cross-field-aware pipeline', async () => {
    type Values = { email: string }

    const form = new Form<Values>({ initialValues: { email: '' } })
    form.registerField('email', { schema: emailSchema, required: true })

    let result = await form.submit()
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual({ email: 'This field is required' })

    form.setValues({ email: 'bad-input' })
    result = await form.submit()
    expect(result.errors).toEqual({ email: 'Invalid email' })

    form.setValues({ email: 'ok@example.com' })
    result = await form.submit()
    expect(result.isValid).toBe(true)
    expect(result.errors).toBeNull()
  })

  test('schema with requiredString type satisfies FieldOptions typing', () => {
    // This is a type-level test — the block must compile. It doesn't need
    // to run. The `schema: StandardSchemaV1<unknown, string>` must be
    // assignable to `FieldOptions<string>["schema"]`.
    const field = new FieldManager<string>('x', { schema: requiredString })
    expect(field).toBeDefined()
  })

})
