import type { ReactElement, ReactNode } from 'react'

import type { FormOptions } from '../Form'
import { Form } from '../Form'
import { FormContextProvider } from '../FormContext'

export interface CreateTestFormResult<FieldValues extends Record<string, any>> {
  /**
   * The `Form` instance under test. Read it directly for assertions,
   * drive it with `setValues`, `submit`, etc., or pass it to any hook
   * that expects an ambient form via `Provider`.
   */
  form: Form<FieldValues>
  /**
   * Wrap your render tree with this component to put the test form on
   * context. Any `useFormContext` / `useFieldRegister` / `useFieldArray`
   * etc. descendants will resolve to the test `form`.
   *
   * The wrapper does NOT destroy the form on unmount — the caller owns
   * the form's lifetime. Call `result.form.destroy()` in teardown if
   * your test runs leak-sensitive checks.
   */
  Provider: (props: { children: ReactNode }) => ReactElement
}

/**
 * Construct a `Form` + a minimal `Provider` for use in tests.
 *
 * Renderer-agnostic — pair it with `@testing-library/react`, Enzyme,
 * or a bare `react-dom/client` root. The point is to let test code
 * reach the form directly (for assertions and mutations) without
 * climbing through `useForm` in a capture-component dance.
 *
 * ```tsx
 * import { createTestForm } from 'formular/testing'
 *
 * test('NameField reflects initial value', () => {
 *   const { form, Provider } = createTestForm<Contact>({
 *     initialValues: { name: 'Ada', email: '' },
 *   })
 *
 *   render(
 *     <Provider>
 *       <NameField />
 *     </Provider>
 *   )
 *
 *   expect(form.getField('name')?.getValue()).toBe('Ada')
 * })
 * ```
 */
export function createTestForm<FieldValues extends Record<string, any>>(
  options: FormOptions<FieldValues> = {},
): CreateTestFormResult<FieldValues> {
  const form = new Form<FieldValues>(options)

  const Provider = ({ children }: { children: ReactNode }) => (
    <FormContextProvider<FieldValues> form={form}>
      {children}
    </FormContextProvider>
  )

  return { form, Provider }
}
