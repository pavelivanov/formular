# Formular

Easy way to work with forms in React. Using React Hooks 😏

<p>❤️ Just 3kb gzip</p>
<p>❤️ React hooks</p>
<p>❤️ TypeScript</p>
<p>❤️ Changes made within form rerender only changed fields</p>


#### Installation

```
npm install formular
```


## Philosophy

There are many form libraries that works out of the box - _"import Form, Field and that's it"_. But in most projects common fields are customized by design and usage of Form, Field components become impossible. **Formular** doesn't provide inboxing components for fast start, but it provides easy way to attach form functionality to custimized fields!

For example you have your own styled `Input` component with specific logic inside

```tsx
import { useField, useFieldState } from 'formular'

const FormularInput = () => {
  const field = useField()
  const state = useFieldState(field)

  return <CustomInput value={state.value} onChange={field.set} />
}
```

`useField` is a wrapper for `new Field`:

```tsx
const useField = (opts, deps) => useMemo(() => new Field(opts), deps || [])
```

So when field's state updates FormularSelect doesn't render. Here `useFieldState` comes, it triggers react state update which call component's render.

#### This is Field, and whats about Form?

Lets update the code above to reuse Select component

```tsx
import { useField, useFieldState } from 'formular'

const FormularInput = ({ field }) => {
  const state = useFieldState(field)

  return <CustomInput value={state.value} onChange={field.set} />
}

const Auth = () => {
  const emailField = useField()
  const passwordField = useField()

  return (
    <>
      <FormularInput field={emailField} />
      <FormularInput field={passwordField} />
    </>
  )
}
```

Let's add validators and submit logic


```tsx

const required = (value) => {
  if (!value) {
    return 'Required'
  }
}

const Auth = () => {
  const emailField = useField({
    validate: [ required ],
  })
  const passwordField = useField({
    validate: [ required ],
  })

  const handleSubmit = useCallbac(async () => {
    const isEmailValid = await emailField.validate()
    const isPasswordValid = await passwordField.validate()
    
    const emailValue = emailField.state.value
    const passwordValue = passwordField.state.value
    
    const emailError = emailField.state.error
    const passwordError = passwordField.state.error
  }, [])

  return (
    <>
      <FormularInput field={emailField} />
      <FormularInput field={passwordField} />
      <button onClick={handleSubmit}>Login</button>
    </>
  )
}
```

Same could be written using `useForm`

```tsx
const Auth = () => {
  const form = useForm({
    email: [ required ],
    password: [ required ],
  })

  const handleSubmit = useCallbac(async () => {
    const isValid = await form.validate()
    
    const values = form.getValues() // { email: '', password: '' }
    const errors = form.getErrors() // { email: 'Required', password: 'Required' }
  }, [])

  return (
    <>
      <FormularInput field={emailField} />
      <FormularInput field={passwordField} />
      <button onClick={handleSubmit}>Login</button>
    </>
  )
}
```

in most cases you need submit

```tsx
const handleSubmit = useCallbac(async () => {
  try {
    const values = await form.submit() // { email: '', password: '' }
  }
  catch (errors) {} // { email: 'Required', password: 'Required' }
}, [])
```


### Validation

```
const required = (value) => {
  if (!value) {
    return 'Required'
  }
}

const uniqueEmail = async (value) => {
  const isExist = await fetch(`check-email-exist?email={value}`)
  
  if (isExists) {
    return 'Account with such email already exists'
  }
}

const field = useField({
  validate: [ required, uniqueEmail ]
})

const isValid = await field.validate()
```

☝️ `field.validate()` always async!<br />
☝️ a validator function should return `undefined` if value is valid



## Examples

- [Basics](https://codesandbox.io/s/formular-basics-cke7r)
- [Building own Input](https://codesandbox.io/s/formular-building-own-input-4qsxd)
- [Async validation](https://codesandbox.io/s/formular-async-validation-i6l4c)


## Options

#### Form

```ts
type FormOpts = {
  name?: string
  fields: {
    [key: string]: FieldOpts
  }
  initialValues?: object
}
```

#### Field

```ts
type FieldOpts = {
  name?: string
  value?: string                // initial value
  validate?: Array<Function>    // list of validators
  readOnly?: boolean
  validationDelay?: number      // adds debounce to validation
}
```


## Interfaces

#### Form

```ts
type FormEntity = {
  name?: string
  opts: FormOpts
  fields: {
    [key: string]: Field
  }
  state: {
    isValid: boolean
    isChanged: boolean
    isValidating: boolean
    isSubmitting: boolean
    isSubmitted: boolean
  }
  setState(values: Partial<State>): void
  setValues(values: object): void
  getValues(): object
  unsetValues(): void
  getErrors(): object
  async validate(): Promise<boolean>
  async submit(): Promise<object>
  on(eventName: string, handler: Function): void
  off(eventName: string, handler: Function): void
}

const form: FormEntity = useForm(opts)
```

#### Field

```ts
type FieldEntity = {
  form?: Form
  name?: string
  opts: FieldOpts
  node?: HTMLElement
  validators: Array<Function>
  readOnly: boolean
  debounceValidate: Function  // method to call validation with debounce
  state: {
    value: any
    error: any
    isChanged: boolean
    isValidating: boolean
    isValidated: boolean
    isValid: boolean
  }
  setState(values: Partial<State>): void
  setRef(node: HTMLElement): void
  unsetRef(): void
  set(value: any): void
  unset(): void
  validate = (): CancelablePromise
  on(eventName: string, handler: Function): void
  off(eventName: string, handler: Function): void
}

const field: FieldEntity = useField(opts)
```


## Events

#### Form

```ts
form.on('state change', (state) => {
  // triggers on a form's state change
})

form.on('change', (field) => {
  // triggers on a field change
})

form.on('blur', (field) => {
  // triggers on a field blurring
})
```

#### Field

```ts
form.on('state change', (state) => {
  // triggers on a field's state change
})

field.on('set', (value) => {
  // triggers on a value set
})

field.on('change', (value) => {
  // simlink to "set"
})

field.on('unset', () => {
  // triggers on a value unset
})

field.on('start validate', () => {
  // triggers on a validation start
})

field.on('validate', (error) => {
  // triggers on a validation finish
})

field.on('blur', () => {
  // triggers on a field blurring
})
```
