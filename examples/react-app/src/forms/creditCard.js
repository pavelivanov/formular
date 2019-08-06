import Form from 'formular'
import { required, cardNumber, expDate, cardCVV } from './validation'


const creditCardForm = new Form({
  fields: {
    cardNumber: [ required, cardNumber ],
    holderName: [ required ],
    expDate: [ required, expDate ],
    cvc: [ required, cardCVV ],
  },
})


export default creditCardForm
