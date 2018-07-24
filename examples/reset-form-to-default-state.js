import Form from '../src/Form'
import { required, streetAddress, telephone } from './util/validation'


const form = new Form({
  fields: {
    address: [ required, streetAddress ],
    telephone: [ telephone ],
  },
})

const initialState = form

console.log('initial state', initialState)

form.fields.address.set('New York')

const newState = form

console.log('new state', newState)

const stateAfterReset = form.reset()

console.log('state after reset', stateAfterReset)

// TODO fix with deepclone
console.log('is not same', stateAfterReset !== newState)
console.log('is same', stateAfterReset === initialState)

