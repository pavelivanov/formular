import Form from '../src/Form'
import { required, streetAddress, telephone } from './util/validation'


const form = new Form({
  fields: {
    address: [ required, streetAddress ],
    telephone: [ telephone ],
  },
})


const error = form.fields.address.validate()

console.log('error', error)
