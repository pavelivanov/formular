import Form from '../src/Form'
import FormGroup from '../src/FormGroup'
import { required, streetAddress, telephone } from './util/validation'


const shippingForm = new Form({
  fields: {
    address: [ required, streetAddress ],
    telephone: [ telephone ],
  },
})

const billingForm = new Form({
  fields: {
    address: [ required, streetAddress ],
    telephone: [ telephone ],
  },
})

const creditCardForm = new Form({
  fields: {
    cardNumber: [ required ],
  },
})

const group = new FormGroup({
  shipping: shippingForm,
  billing: billingForm,
  creditCard: creditCardForm,
})


console.log(group)
