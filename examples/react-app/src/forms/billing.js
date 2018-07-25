import Formx from 'formx'
import { required, streetAddress, telephone } from './validation'


const billingForm = new Formx({
  fields: {
    address: [ required, streetAddress ],
    telephone: [ telephone ],
  },
})


export default billingForm
