import Formx from '../../src'
import { required, streetAddress, telephone } from './validation'


const createForm = () =>
  new Formx({
    fields: {
      shipping: {
        fields: {
          address: {
            validate: [ required, streetAddress ],
            value: 'New York',
          },
          telephone: [ telephone ],
        },
      },
      billing: {
        fields: {
          address: [ required, streetAddress ],
        },
      },
      sameAddress: [],
    },
  })


export default createForm
