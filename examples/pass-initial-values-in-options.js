import Form from '../src/Form'
import { required, streetAddress, telephone } from './util/validation'


const form = new Form({
  fields: {
    address: [ required, streetAddress ],
    telephone: [ telephone ],
  },
  initialValues: {
    address: 'New York',
    telephone: '+1 201 123-45-67',
  }
})


console.log('initial values', form.getValues())
