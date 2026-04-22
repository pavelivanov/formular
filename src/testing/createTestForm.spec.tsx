// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import { useFieldRegister, useFormState } from '../hooks'
import { createTestForm } from './createTestForm'

type Contact = { name: string; email: string }

afterEach(cleanup)

describe('createTestForm', () => {

  test('Provider puts the test form on context', () => {
    const { form, Provider } = createTestForm<Contact>({
      initialValues: { name: 'Ada', email: 'ada@example.com' },
    })

    function NameField() {
      const field = useFieldRegister<string>('name')
      return <input data-testid="name" value={field.state.value ?? ''} readOnly />
    }

    const { container } = render(
      <Provider>
        <NameField />
      </Provider>,
    )

    // The field was hydrated from the Form's initialValues, proving
    // the hook resolved to the test form instance.
    expect(
      (container.querySelector('[data-testid="name"]') as HTMLInputElement).value,
    ).toBe('Ada')
    expect(form.getField('name')?.getValue()).toBe('Ada')
  })

  test('mutating the form from the test drives rendered fields', async () => {
    const { form, Provider } = createTestForm<Contact>({
      initialValues: { name: '', email: '' },
    })

    function NameField() {
      const field = useFieldRegister<string>('name')
      return <input data-testid="name" value={field.state.value ?? ''} readOnly />
    }

    const { container } = render(
      <Provider>
        <NameField />
      </Provider>,
    )

    await act(async () => {
      form.setValues({ name: 'Grace' })
    })

    expect(
      (container.querySelector('[data-testid="name"]') as HTMLInputElement).value,
    ).toBe('Grace')
  })

  test('driving an input through user events flows back into the form', () => {
    const { form, Provider } = createTestForm<Contact>({
      initialValues: { name: '', email: '' },
    })

    function NameField() {
      const field = useFieldRegister<string>('name')
      return (
        <input
          data-testid="name"
          value={field.state.value ?? ''}
          onChange={(e) => field.setValue(e.target.value)}
        />
      )
    }

    const { container } = render(
      <Provider>
        <NameField />
      </Provider>,
    )

    const input = container.querySelector('[data-testid="name"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Hopper' } })

    expect(form.getField('name')?.getValue()).toBe('Hopper')
    expect(form.getValues().name).toBe('Hopper')
  })

  test('useFormState subscribers see updates from the test form', async () => {
    const { form, Provider } = createTestForm<Contact>({
      initialValues: { name: '', email: '' },
    })

    function StateBadge() {
      const state = useFormState()
      return <span data-testid="valid">{String(state.isValid)}</span>
    }

    const { container } = render(
      <Provider>
        <StateBadge />
      </Provider>,
    )
    const scope = within(container)

    expect(scope.getByTestId('valid').textContent).toBe('true')

    await act(async () => {
      form.setErrors({ name: 'broken' })
    })

    // setErrors itself doesn't set isValid; setting a field error via
    // the field's own setError does. Use getField instead.
    expect(scope.getByTestId('valid').textContent).toBe('true')

    // Now set an error via a registered field and check state propagates
    await act(async () => {
      form.registerField('name', {})
      form.getField('name')?.setError('required')
    })

    expect(scope.getByTestId('valid').textContent).toBe('false')
  })

  test('Provider does not destroy the form on unmount', () => {
    // Regression: the caller owns the form. If ManagedProvider's destroy
    // effect leaked into the test path, form.getValues() after unmount
    // would throw or return {}.
    const { form, Provider } = createTestForm<Contact>({
      initialValues: { name: 'Ada', email: '' },
    })

    form.registerField('name', { defaultValue: '' })
    const { unmount } = render(<Provider><span /></Provider>)

    unmount()

    // Still usable post-unmount.
    expect(form.getField('name')?.getValue()).toBe('Ada')
    form.setValues({ name: 'Mary' })
    expect(form.getField('name')?.getValue()).toBe('Mary')
  })

})
