import Formx from 'formx'
import { required } from './validation'


const creditCardForm = new Formx({
  fields: {
    cardNumber: [ required ],
  },
})


export default creditCardForm
