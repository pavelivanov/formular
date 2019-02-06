import React from 'react'
import PropTypes from 'prop-types'

import Field from '../../components/Field'


const CreditCardForm = ({ className, fields }) => (
  <div className={`row ${className}`}>
    <div className="col col-12">
      <Field field={fields.cardNumber} placeholder="Card number" />
    </div>
    <div className="col col-6">
      <Field field={fields.holderName} placeholder="Name on card" />
    </div>
    <div className="col col-3">
      <Field field={fields.expDate} placeholder="MM/YY" />
    </div>
    <div className="col col-3">
      <Field field={fields.cvc} placeholder="CVV/CVC" />
    </div>
  </div>
)

CreditCardForm.propTypes = {
  fields: PropTypes.object.isRequired,
}


export default CreditCardForm
