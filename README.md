# Formular

Easy way to work with forms in React. Using React Hooks 😏


## Features

- Just 3kb gzip.
- React hooks included.
- Easy way to start work with forms in React in 2 steps: install and use it 😎. 
- Changes made within form rerender only changed fields not everything unlike in most other form libs.


## Quick start

#### Installation

```
npm install formular
```

#### Usage

```jsx harmony
import { useForm } from 'formular'
import { Input } from 'formular/lib/tags'

const App = () => {
  const form = useForm({
    fields: {
      email: [ required ],
      password: [ required ],
    },
  })

  return (
    <Input field={form.fields.email} />
  )  
}
```

Or if you need only one field you can just do

```jsx harmony
import { useField } from 'formular'
import { Input } from 'formular/lib/tags'

const App = () => {
  const field = useField({
    validate: [ required ],
  })

  return (
    <Input field={field} />
  ) 
}
```


## Examples

- [Basics](https://codesandbox.io/s/formular-basics-cke7r)
- [Basics](https://codesandbox.io/s/formular-basics-cke7r)
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

##### Field validation

```ts
// validator should return "undefined" if value is valid
const required = (value) => !value && value !== 0 ? 'Required' : undefined 

useField({
  name: 'email',
  validate: [ required ],
})
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
