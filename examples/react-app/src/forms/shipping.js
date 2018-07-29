import Formx from 'formx'
import { required, streetAddress, zipCode, telephone, minLength, successAsyncValidation } from './validation'


const shippingForm = new Formx({
  fields: {
    firstName: [ required ],
    lastName: [ required ],
    street: [ required, successAsyncValidation, streetAddress ],
    apt: [],
    zipCode: [ required, zipCode ],
    city: [ required, minLength(3) ],
    state: [ required ],
    country: {
      validate: [ required ],
      value: 'United States',
    },
    telephone: [ telephone ],
  },
})


export default shippingForm
