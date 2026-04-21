# formular

> Small, type-safe form library for React. Form state lives in a pure JS
> class graph wired together by an event emitter; React components subscribe
> via hooks and opt in to re-renders only for the slice they care about.

[![npm](https://img.shields.io/npm/v/formular.svg)](https://www.npmjs.com/package/formular)

**v4 is a complete rewrite** and is currently shipping as an alpha. The
stable v3.x line remains published on npm. See [CHANGELOG.md](./CHANGELOG.md)
for the full migration guide.

## Why

Most form libraries store form state in React state. That couples every
keystroke to the render tree and makes large forms easy to thrash.

`formular` keeps form state outside of React:

- `Form<FieldValues>` and `FieldManager<T>` are plain classes with their own
  state machines.
- Mutations emit events; components that want to react subscribe through
  hooks backed by `useSyncExternalStore`.
- No React state means no render cascade on every field update, and no
  provider re-creation churn when `initialValues` load asynchronously.

Current bundle: **~6.8 KB gzip (ESM)**, including 15 built-in validators.

## Install

```bash
npm install formular@next
# or
npm install formular@4.0.0-alpha.1
```

Peer: `react >=18`.

## Basic usage

```tsx
import {
  FormContextProvider,
  FieldError,
  FieldLabel,
  useFieldRegister,
  useFormContext,
  useFormState,
} from 'formular'

type ContactForm = {
  name: string
  email: string
}

function NameField() {
  const field = useFieldRegister<ContactForm>('name', { required: true })

  return (
    <div>
      <FieldLabel field={field}>Name</FieldLabel>
      <input
        value={field.state.value}
        onChange={(e) => field.setValue(e.target.value)}
        aria-invalid={!!field.state.error}
      />
      <FieldError field={field} />
    </div>
  )
}

function SubmitButton() {
  const form = useFormContext<ContactForm>()
  const { isSubmitting, isValid } = useFormState()

  return (
    <button
      disabled={isSubmitting || !isValid}
      onClick={form.handleSubmit((values) => console.log('submit', values))}
    >
      Submit
    </button>
  )
}

export function ContactFormPage() {
  return (
    <FormContextProvider<ContactForm> initialValues={{ name: '', email: '' }}>
      <NameField />
      <SubmitButton />
    </FormContextProvider>
  )
}
```

## API

### Components

- **`FormContextProvider<FieldValues>`** — creates a `Form` instance and puts
  it on context. Props: `initialValues`, `onSubmit`, `onSubmitError`,
  `onChange`, `formId`, `children`. If `initialValues` changes after mount it
  re-seeds the form (edited fields keep their current value; untouched fields
  update; unmounted fields pick up the new seed on registration).
- **`FieldLabel`** — label bound to a field; renders a `*` when the field
  is required. Defaults `htmlFor` to `field.name` unless `id` is provided.
  Headless — pass your own `className`s.
- **`FieldError`** — renders the field's current error message as an
  `aria-live="polite"` region (or nothing when no error).

### Hooks

- **`useForm<FieldValues>()`** — returns the ambient `Form` instance.
- **`useFormContext<FieldValues>()`** — alias of `useForm`; throws if used
  outside a provider.
- **`useFormState()`** — subscribes to form state changes. Only components
  that call this re-render on form state changes.
- **`useFieldRegister<FieldValues>(name, options?)`** — registers a field
  (or returns the existing one) and subscribes the component to it. The typed
  overload constrains `name` to `keyof FieldValues` and returns
  `FieldManager<FieldValues[K]>`.
- **`useField<T>(name)`** — read-only subscription to a field that some
  other component registered. Returns `undefined` until it registers.
- **`useFormValidation()`** — returns stable `{ validate, submit, reset }`
  callbacks bound to the form.

### Validation

Fields support three, complementary validation sources, run in this order:

1. **`required: true`** — empties fail with `"This field is required"`.
2. **`schema`** — any [Standard Schema v1](https://standardschema.dev)
   implementation (Zod 3.24+, Valibot 0.40+, ArkType, …). First issue
   message becomes the error.
3. **`validators`** — array of functions returning `string | null` or
   `Promise<string | null>`. First non-null wins.

Each stage short-circuits on the first error.

#### Standard Schema

```ts
import { z } from 'zod'
import { useFieldRegister } from 'formular'

const field = useFieldRegister<ContactForm>('email', {
  schema: z.string().email('Invalid email'),
  required: true,
})
```

Sync and async schemas are both supported. Value transformations from the
schema (e.g. Zod's `.transform()`) are **not** applied to the field value;
if you need the parsed value, parse it yourself in `onSubmit`.

#### Built-in function validators

All return `null` on success and a message on failure. Compose with
`compose(...)` or pass as the `validators: [...]` field option.

```ts
import { compose, email, minLength, useFieldRegister } from 'formular'

const field = useFieldRegister<ContactForm>('email', {
  validators: [ compose(email(), minLength(5)) ],
  required: true,
})
```

Built-ins:

- **String/number:** `minLength`, `maxLength`, `pattern`, `email`, `url`,
  `phoneNumber`, `numeric`, `min`, `max`, `creditCard`.
- **Date:** `dateFormat`, `minAge`.
- **Cross-field:** `confirmField(otherName, message?)`.
- **Async:** `asyncValidator(fn)` — wraps an async function; thrown errors
  become error strings. Does **not** debounce — use the field's
  `validationDelay` option for that.

If you're starting a new project today, **prefer `schema`** over the
built-ins — it scales to the whole ecosystem (Zod/Valibot/ArkType) and
gives you composition, transforms, and inference for free.

### `FieldOptions`

```ts
type FieldOptions<T> = {
  defaultValue?: T
  validators?: Validator<T>[]
  /** Milliseconds to debounce in-flight validation after setValue. */
  validationDelay?: number
  required?: boolean
  readOnly?: boolean
  /** Override the default "value is empty" check used by `required`. */
  emptyCheckFn?: (value: T) => boolean
}
```

### Events

`Form` emits:

| Name                  | Payload                       | When                                        |
|-----------------------|-------------------------------|---------------------------------------------|
| `state change`        | `FormState`                   | Any tracked form-level state change         |
| `change`              | `values`                      | Any field value actually changed            |
| `field registered`    | `name, FieldManager`          | A new field registered                      |
| `field unregistered`  | `name`                        | A field unregistered                        |
| `submit`              | `{ values, errors }`          | Submit completed (valid or invalid)         |
| `submit error`        | `error, { values, errors, isValid, phase }` | Submit/onSuccess threw        |

Hook helpers (`useFormState`, `useField`, `useFieldRegister`) wire the right
subscriptions for you — reach for raw `form.on` only for side effects
outside the render tree.

## Dynamic & conditional fields

Fields register when their component mounts and unregister on unmount.
Unmounting a field destroys its state. If you need persistence across
visibility, keep the field mounted (`display: none`) or hoist the value up
via `setValues`.

## Hydrating from async data

Two patterns work:

1. **Gate the provider on data** — render `FormContextProvider` only once
   server data is ready.
2. **Hydrate lazily** — render the provider immediately, then call
   `form.setValues(data)` or re-seed via changing `initialValues`.
   `setValues` buffers keys for fields that haven't mounted yet, so ordering
   between data arrival and field registration doesn't matter.

## v3 → v4

v4 is a ground-up rewrite. The API from v3 is not preserved. See
[CHANGELOG.md](./CHANGELOG.md) for the mapping.

If you're on v3 and don't want to migrate, the v3.x line will continue to
receive security and correctness fixes.

## License

ISC
