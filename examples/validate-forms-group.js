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


const init = () => {
  group.submit()
    .then((values) => {
      console.log('values', values)
    }, (errors) => {
      console.log('errors', errors)

      shippingForm.fields.address.set('Foo 2')
      billingForm.fields.address.set('Bar 2')
      creditCardForm.fields.cardNumber.set(4242)

      console.log('\n----------')
      init()
    })
}

init()
