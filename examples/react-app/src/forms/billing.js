import Formx from 'formx'
import { required, streetAddress, zipCode, minLength } from './validation'


const billingForm = new Formx({
  fields: {
    firstName: [ required ],
    lastName: [ required ],
    street: [ required, streetAddress ],
    apt: [],
    zipCode: [ required, zipCode ],
    city: [ required, minLength(3) ],
    state: [ required ],
    country: {
      validate: [ required ],
      value: 'United States',
    },
  },
})


export default billingForm
