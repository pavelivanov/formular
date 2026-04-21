# Migrating from v3 to v4

v4 is a ground-up rewrite. The public API from v3 is not preserved.
v3.x remains published on npm under the `latest` dist-tag; v4 ships
under `next` until it has proved stable with external adopters.

```bash
# Stay on v3 (default):
npm install formular

# Try v4:
npm install formular@next
```

This document maps every v3 primitive to its v4 equivalent. If something
here isn't clear, please open an issue — real migration reports are the
most valuable thing we can get during beta.

## Setup — from `new Form(...)` to `createForm<T>()`

### v3

```tsx
import { useForm } from 'formular'

function ContactPage() {
  const form = useForm<ContactForm>({
    fields: {
      name: [ required, minLength(2) ],
      email: { validate: [ required, email ] },
    },
    initialValues: { name: '', email: '' },
  })

  return <MyFields form={form} />
}
```

### v4

```tsx
import { createForm } from 'formular'
import { minLength } from 'formular'
import { z } from 'zod'

type ContactForm = { name: string; email: string }

// Call createForm ONCE at module scope. The returned object holds
// typed hooks + the Provider, all bound to ContactForm.
const contact = createForm<ContactForm>()

function ContactPage() {
  return (
    <contact.FormContextProvider initialValues={{ name: '', email: '' }}>
      <NameField />
      <EmailField />
    </contact.FormContextProvider>
  )
}

function NameField() {
  // Path is type-checked against ContactForm; returns FieldManager<string>.
  const field = contact.useFieldRegister('name', {
    required: true,
    validators: [ minLength(2) ],
  })

  return (
    <input
      value={field.state.value ?? ''}
      onChange={(e) => field.setValue(e.target.value)}
    />
  )
}

function EmailField() {
  // Prefer a Standard Schema over the built-in validators where possible —
  // any Zod / Valibot / ArkType schema works natively, no adapter package.
  const field = contact.useFieldRegister('email', {
    schema: z.string().email(),
    required: true,
  })
  return <input value={field.state.value ?? ''} onChange={(e) => field.setValue(e.target.value)} />
}
```

Key shifts:

- **No more declaring all fields at `useForm()` creation time.** Each
  component registers the field it owns via `useFieldRegister(name, …)`.
- **`FormContextProvider`** puts the form on React context; siblings and
  descendants reach it via `contact.useForm()` / `useFormContext()`.
- **`createForm<T>()`** is the typed entry point. It's not strictly
  required — the raw `useFieldRegister`, `useFieldArray`, etc. still
  work as direct hooks — but without it, TypeScript can't narrow your
  field paths (more on this below).

## API mapping

| v3                                                             | v4                                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `new Form({ fields: { name: [v] }, initialValues })`           | `new Form({ initialValues })` + `form.registerField('name', { validators: [v] })` |
| `useForm({ fields: {…} })`                                     | `<FormContextProvider>` + `createForm<T>().useFieldRegister(...)`             |
| `useField(fieldInstance)`                                      | `contact.useFieldRegister('path')` or `useFieldRegister<T>('path')`           |
| `useFieldState(field)`                                         | `field.state` (plain property; the field is reactive by itself)               |
| `form.fields.name`                                             | `form.getField('name')`                                                       |
| `form.fields.name.set(v)`                                      | `form.getField('name')?.setValue(v)` or `form.setValues({ name: v })`         |
| `field.props.ref`, `field.props.onChange`                      | Wire yourself: `<input value={field.state.value} onChange={(e) => field.setValue(e.target.value)} />` |
| `<FieldState field={field}>`                                   | Drop the component; read `field.state` directly                               |
| `FormGroup` (multi-form coordination)                          | Not ported. Compose via multiple `FormContextProvider`s, or express nesting as field paths. |
| Fields typed by passing the shape into `useForm<T>`            | `createForm<T>()` — or pass `<T>` on the direct hooks                         |
| Validator: `(value, fields) => string \| undefined`            | Same shape; plus native support for Standard Schema v1                        |
| Custom async via `CancelablePromise`                           | Gone. Async is plain `Promise`; stale runs discard themselves via a counter.  |

## Value / initial value / errors

```tsx
// v3
form.setValues({ name: 'Ada' })
form.getValues()
form.getErrors()
form.unsetValues()

// v4
form.setValues({ name: 'Ada' })          // same, but accepts DeepPartial<T>
form.getValues()                         // same, reconstructs nested shape
form.getErrors()                         // returns { path: message } with dotted keys
form.reset()                             // renamed from unsetValues
form.setInitialValues(next)              // re-seed; edited fields keep their value
```

## Nested fields

v3 had no typed path story — nested shapes were either flat keys or a
separate `FormGroup`. v4 types dotted paths end-to-end:

```tsx
type Contact = {
  name: string
  address: { street: string; zip: string }
}

const contact = createForm<Contact>()

function ZipField() {
  const field = contact.useFieldRegister('address.zip')
  //    ^? FieldManager<string>
  …
}
```

`setValues({ address: { zip: '10001' } })` walks the shape down to the
registered field. If multiple consumers register nested paths, they each
get their own `FieldManager`.

## Field arrays

v3 had no first-class field-array story. v4 ships `useFieldArray`:

```tsx
const contact = createForm<{ tags: string[] }>()

function Tags() {
  const { fields, append, remove, move } = contact.useFieldArray('tags')

  return (
    <>
      {fields.map((f) => (
        <Row key={f.id}>
          <input />
          <button onClick={() => remove(f.index)}>×</button>
        </Row>
      ))}
      <button onClick={() => append('')}>+ add</button>
    </>
  )
}
```

Sub-fields registered at `tags.<N>.<rest>` are reindexed automatically
when the list mutates — a field's value, error, and touched state carry
over to the new index.

## Submit lifecycle

```tsx
// v3
form.submit()
  .then(({ values, errors }) => …)

// v4
form.submit()
  .then(({ values, errors, isValid }) => …)

// OR use handleSubmit for a React-safe handler:
const handler = form.handleSubmit((values) => {
  // only fires on valid submit
})
<form onSubmit={handler}>…</form>
```

New in v4: distinct `submit` and `submit error` events, and
`onSubmitError(error, { values, errors, isValid, phase })` on
`FormOptions`. The `phase` is `'submit'` for validation errors and
`'onSuccess'` for errors thrown by a `handleSubmit` callback.

## Typing caveats

**If you used the v3 `useForm<T>({ fields: {…} })` pattern, your types
flowed from the fields object.** In v4 they flow from `createForm<T>()`.
Passing `<T>` directly on the raw hooks doesn't narrow literal paths
because of a TypeScript partial-explicit-generic limitation — use
`createForm<T>()` for typed forms, and the raw hooks for ad-hoc /
untyped fields.

## Peer dep

React ≥ 17 in v3 → **React ≥ 18 in v4** (uses `useSyncExternalStore`).

## Things to remove

The following v3 exports are gone entirely:

- `FormGroup`
- `FieldState` (render-prop component)
- `Field.props.ref`, `Field.props.onChange`
- `CancelablePromise` utility
- The `asyncSome` helper

## Staying on v3

The v3.x line will continue to receive security and correctness patches
for as long as anyone's using it. `npm install formular` (no tag) pulls
v3 until we promote v4 to `latest`. An unpublished v3.1.7 exists on the
repo's `master` branch with a bundle of leak/race fixes (see the
CHANGELOG) — open an issue if you'd like it published.
