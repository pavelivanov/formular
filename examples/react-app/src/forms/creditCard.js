import Formx from 'formx'
import { required, cardNumber, expDate, cardCVV } from './validation'


const creditCardForm = new Formx({
  fields: {
    cardNumber: [ required, cardNumber ],
    holderName: [ required ],
    expDate: [ required, expDate ],
    cvc: [ required, cardCVV ],
  },
})


export default creditCardForm
