import Form from '../src/Form'
import { required, streetAddress, successAsyncValidation, failAsyncValidation } from './util/validation'


const form = new Form({
  fields: {
    address: [ required, failAsyncValidation, streetAddress ],
  },
  initialValues: {
    address: 'New York',
  },
})


const init = async () => {
  const isValid = await form.validate()
  const errors = form.getErrors()

  console.log('isValid', isValid)
  console.log('errors', errors)
}

init()
