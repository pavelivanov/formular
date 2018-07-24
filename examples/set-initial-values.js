import Form from '../src/Form'
import { required, streetAddress, telephone } from './util/validation'


const form = new Form({
  fields: {
    address: [ required, streetAddress ],
    telephone: [ telephone ],
  },
})

console.log('initial values', form.getValues())

form.setInitialValues({
  address: 'New York',
  telephone: '+1 201 123-45-67',
})

console.log('passed initial values', form.getValues())
