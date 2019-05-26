# Formx

## Usage

### Form initialization

```
import Formx from 'formx'


const form = new Formx({
  fields: {
    email: {
      validate: [ required, email ],
    },
  },
  initialValues: {
    email: 'test-email@test.com',
  },
})
```

### React example

```
import { Input } from 'formx/react/tags'


const handleSubmit = () => form.submit()

const Form = () => (
  <form>
    <Input field={form.fields.email} />
    <button onClick={handleSubmit)>Submit</button>
  </form>
)
```

## Form

### Properties

`opts: object`

Your form options.

`fields: object`

Your form fields.

`isValid: boolean`

Keeps form validation state. Default is `true`.

`isChanged: boolean`

Tells if form has been changed. Default is `false`.

### Methods

`setInitialValues: (values: object) => void`

Calls `field.setInitialValue(value)` for every form field.

`setValues: (values: object) => void`

Calls `field.set(value)` for every form field.

`unsetValues: () => void`

Calls `field.unset()` for every form field.

`getValues: () => object`

Returns current form field values.

`getErrors: () => object`

Returns current form field errors.

`validate: async () => boolean`

Fires form validation and returns resulted validation state.

`submit: async () => object`

Calls `validate` method and then if form passed the validation it returns `getValues` result. If not, it returns `getErrors` result.

`on: (eventName: string, handler: Function) => void`

Subscribes `handler` to the event with certain `eventName`.

`off: (eventName: string, handler: Function) => void`

Unsubscribes `handler` from the event with certain `eventName`.

## Field

### Usage

```
const options = {
  validate: [ required, email ],
  value: 'test-email@test.com',
}

const emailField = new Field('email', options)

const passwordField = new Field('password', [ required ])
```

Your field options can be either object or array. If it's an array, it will be used as `options.validate` param.

`options.validate: array`

An array of your field validators.

`options.value?: any`

Your field initial value.

`options.hasAsyncValidators?: boolean`

Determines if your field has async validators. Default is `false`.

### Properties

`node: Node`

Field's html node ref.

`name: string`

Field's name.

`validators: array`

Array of field's validators.

`value: any`

Field's value.

`initialValue: any`

Field's initial value.

`error: string`

Field's error.

`isChanged: boolean`

Determines whether field was changed. Default is `false`.

`isValid: boolean`

Determines whether field passed validation. Default is `true`.

`cancelablePromise: Promise`

TODO

`hasAsyncValidators: boolean`

Determines whether field has async validators. Default is `false`.

`debounceValidate: Function`

TODO

### Methods

`setInitialValue: (value: any) => void`

Sets field's initial value.

`setRef: (node: Node) => void`

Sets field's node ref.

`unsetRef: (node: Node) => void`

Unsets field's node ref.

`setInitialValue: (value: any) => void`

Sets field's initial value.

`handleBlur: () => void`

TODO

`set: (value: any) => void`

Sets field's new value. New value is set when it is not equal to current value.

`unset: () => void`

Unsets field.

`validate: async () => string`

Fires field validation and returns validation error.

`on: (eventName: string, handler: Function) => void`

Subscribes `handler` to the event with certain `eventName`.

`off: (eventName: string, handler: Function) => void`

Unsubscribes `handler` from the event with certain `eventName`.

## FormGroup

### Usage

If you are using several forms and you need to control them in one place you can combine them using `FormGroup`

```
import Formx, { FormGroup } from 'formx'

const shippingAddressForm = new Formx({
  fields: {
    zip: [ required ],
    address: [ required ],
    city: [ required ],
    country: [ required ],
  },
})

const creditCardForm = new Formx({
  fields: {
    cardNumber: [ required ],
    expDate: [ required ],
    cvv: [ required ],
  },
})

const formGroup = new FormGroup({ shippingAddressForm, creditCardForm })

```

### Properties

`forms: object`

An object containing forms instances.

### Methods

`replace: (forms: object) => void`

Reinitialises your form group with new `forms`.

`validate: () => boolean`

Calls `validate` method for each form in form group and returns validation result. If one of the forms is not valid then the result is `false`, otherwise the result is `true`.

`setValues: (values: object) => void`

Calls `setValues` method for each form in form group if `values['yourFormName'] exists.

`getValues: () => object`

Calls `getValues` for each form and returns an object containing these values.

`unsetValues: () => object`

Calls `unsetValues` for each form.

`submit: () => object`

Calls `validate` method and then if forms passed the validation returns `getValues` result. If not, it returns `getErrors` result.

`on: (eventName: string, handler: Function) => void`

Subscribes `handler` to the event with certain `eventName`.

`off: (eventName: string, handler: Function) => void`

Unsubscribes `handler` from the event with certain `eventName`.


## To run examples

```
npx babel-node examples/validate-form.js
```


## TODOs

- [x] Pass initial values in options
- [x] Set initial values
- [x] Validate form
- [x] Validate one field
- [x] Group forms to one container (group)
- [x] Validate forms group
- [x] Async validation
- [x] Validate field on blur
- [x] Validate field on each change if it has been already validated
- [x] Validate field on each change if form was submitted
- [ ] 'isChanged' on field, form, forms group
- [ ] Get forms group state (values, isChanged, etc)
- [ ] Set state to forms group
- [ ] Reset form to default state, options, etc
- [ ] Add option to `setValues()` to allow set values without validation each field
- [ ] Checkbox and Radio support (boolean checked, value)
- [ ] Memo for async validators (decorator)
- [ ] Option for validation debounce timeout
