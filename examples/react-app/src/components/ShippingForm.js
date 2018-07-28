import React from 'react'

import AddressForm from './AddressForm'


const ShippingForm = (props) => (
  <AddressForm {...props} withTelephone />
)

export default ShippingForm
