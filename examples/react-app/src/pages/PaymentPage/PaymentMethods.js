import React from 'react'
import PropTypes from 'prop-types'
import { RadioGroup, Radio } from 'react-radio-group'


const PaymentMethods = ({ value, onChange }) => (
  <RadioGroup name="paymentMethod" selectedValue={value} onChange={onChange}>
    <label>
      <Radio value="creditCard" />Credit card
    </label>
    <label>
      <Radio value="payPal" />PayPal
    </label>
  </RadioGroup>
)

PaymentMethods.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}


export default PaymentMethods
