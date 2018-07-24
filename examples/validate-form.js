import Form from '../src/Form'
import { required, streetAddress, telephone } from './util/validation'


const form = new Form({
  fields: {
    address: [ required, streetAddress ],
    telephone: [ telephone ],
  },
})


const isValid = form.validate()
const errors = form.getErrors()

console.log('isValid', isValid)
console.log('errors', errors)
