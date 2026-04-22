// @vitest-environment jsdom

import { act, cleanup, render, within } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import { FormContextProvider } from '../FormContext'
import { useFieldRegister } from '../hooks'
import { FormularDevtools } from './FormularDevtools'

type Values = { name: string; email: string }

function Registrar() {
  useFieldRegister<string>('name', { defaultValue: '' })
  useFieldRegister<string>('email', { defaultValue: '' })
  return null
}

function mount(
  props: Parameters<typeof FormularDevtools>[0] = {},
  initialValues: Partial<Values> = { name: 'Ada', email: '' },
) {
  // FormularDevtools is rendered BEFORE Registrar so its useEffect
  // subscribes to form events in time to observe the initial
  // registrations — that's also the recommended real-world order.
  return render(
    <FormContextProvider<Values> initialValues={initialValues}>
      <FormularDevtools {...props} />
      <Registrar />
    </FormContextProvider>,
  )
}

afterEach(cleanup)

describe('FormularDevtools', () => {

  test('renders nothing when disabled', () => {
    const { container } = render(
      <FormContextProvider<Values> initialValues={{ name: '', email: '' }}>
        <FormularDevtools enabled={false} />
      </FormContextProvider>,
    )
    expect(container.querySelector('[data-testid="formular-devtools"]')).toBeNull()
  })

  test('renders nothing outside a FormContextProvider', () => {
    const { container } = render(<FormularDevtools />)
    expect(container.querySelector('[data-testid="formular-devtools"]')).toBeNull()
  })

  test('mounts collapsed by default; opens on click', async () => {
    const { container } = mount()
    const scope = within(container)

    const toggle = scope.getByRole('button', { name: /Open formular devtools/i })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(scope.queryByRole('region', { name: /formular devtools/i })).toBeNull()

    await act(async () => {
      toggle.click()
    })

    expect(scope.getByRole('region', { name: /formular devtools/i })).toBeTruthy()
  })

  test('state tab shows current values and validity', () => {
    const { container } = mount({ defaultOpen: true })
    const scope = within(container)

    const region = scope.getByRole('region', { name: /formular devtools/i })
    expect(region.textContent).toMatch(/"name"/)
    expect(region.textContent).toMatch(/"Ada"/)
    expect(region.textContent).toMatch(/valid/i)
  })

  test('fields tab lists every registered field', () => {
    const { container } = mount({ defaultOpen: true, defaultTab: 'fields' })
    const scope = within(container)

    const region = scope.getByRole('region', { name: /formular devtools/i })
    expect(region.textContent).toContain('name')
    expect(region.textContent).toContain('email')
    // Count badge on the FIELDS tab shows 2
    expect(region.textContent).toMatch(/fields\s*2/i)
  })

  test('events tab accumulates dispatched events on registration', () => {
    const { container } = mount({ defaultOpen: true, defaultTab: 'events' })
    const scope = within(container)

    const region = scope.getByRole('region', { name: /formular devtools/i })
    const registeredCount = (region.textContent?.match(/field registered/g) || []).length
    expect(registeredCount).toBeGreaterThanOrEqual(2)
  })

  test('toggle switches aria-expanded state', async () => {
    const { container } = mount()
    const scope = within(container)

    const toggle = scope.getByRole('button', { name: /Open formular devtools/i })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    await act(async () => {
      toggle.click()
    })

    // After open, the toggle's accessible name flips from "Open" to "Close".
    const closeToggle = scope.getByRole('button', { name: /Close formular devtools/i })
    expect(closeToggle.getAttribute('aria-expanded')).toBe('true')
  })

})
