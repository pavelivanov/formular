import Formx from './src/Formx'
import FormxGroup from './src/FormxGroup'
import { required, streetAddress, telephone } from './test/util/validation'


const shippingForm = new Formx({
  fields: {
    address: {
      validate: [ required, streetAddress ],
      value: 'Foo',
    },
    telephone: [ telephone ],
  },
})

const billingForm = new Formx({
  fields: {
    address: {
      validate: [ required, streetAddress ],
      value: 'Foo',
    },
    telephone: [ telephone ],
  },
})

const creditCardForm = new Formx({
  fields: {
    cardNumber: [ required ],
  },
})

const group = new FormxGroup({
  shipping: shippingForm,
  billing: billingForm,
  creditCard: creditCardForm,
})


/* Render

PaymentPage.js

async submit() {
  try {
    const values = await group.submit()
  }
  catch (err) {

  }

  // const isValid = await group.validate()

  {
    shipping: {},
    billing: {},
    creditCard: {},
  }
}

<form onSubmit={this.submit} />


ShippingForm.js

shippingForm.fields.map(() => {
  ...
})


BillingForm.js

billingForm.fields.map(() => {
...
})

 */


// Submit

const init = async () => {
  await group.submit()
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
