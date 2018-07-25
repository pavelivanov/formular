import { FormxGroup } from 'formx'

import shipping from './shipping'
import billing from './billing'
import creditCard from './creditCard'


const paymentForm = new FormxGroup({
  shipping,
  billing,
  creditCard,
})


export default paymentForm
