import React, { useReducer, useEffect } from 'react'
import { FormxGroup } from 'formx'
import { shipping, billing, creditCard } from '../../forms'

import PaymentMethods from './PaymentMethods'
import ShippingForm from './ShippingForm'
import BillingForm from './BillingForm'
import CreditCardForm from './CreditCardForm'


const getFormsGroup = (isSameAddress, paymentMethod) => {
  let forms

  if (paymentMethod === 'payPal') {
    forms = {
      shipping,
    }
  }
  else if (isSameAddress) {
    forms = {
      shipping,
      creditCard,
    }
  }
  else {
    forms = {
      shipping,
      billing,
      creditCard,
    }
  }

  return new FormxGroup(forms)
}

let formGroup


const setInitialValues = () => {
  formGroup.setValues({
    shipping: {
      firstName: 'foo',
      lastName: 'bar',
      street: '121 South Carondelete',
      zipCode: '10095',
      city: 'Los Angeles',
      state: 'CA',
    },
    billing: {
      firstName: 'foo',
      lastName: 'bar',
      street: '121 South Carondelete',
      zipCode: '10095',
      city: 'Los Angeles',
      state: 'CA',
    },
    creditCard: {
      cardNumber: '4242424242424242',
      holderName: 'Foo Bar',
      expDate: '1122',
      cvc: '333',
    },
  })
}

const clearFormsValues = () => {
  formGroup.unsetValues()
}

const clearCreditCardFields = () => {
  formGroup.forms.creditCard.unsetValues()
}

const handleSubmit = (event) => {
  event.preventDefault()

  formGroup.submit()
    .then((values) => {
      console.log('values', values)
    }, (errors) => {
      console.error('errors', errors)
    })
}


const PaymentPage = () => {
  const [ state, setState ] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { isSameAddress: false, paymentMethod: 'creditCard' }
  )

  const { isSameAddress, paymentMethod } = state

  formGroup = getFormsGroup(isSameAddress, paymentMethod)

  const handleChangePaymentMethod = (paymentMethod) => {
    setState({
      paymentMethod,
    })
  }

  const handleChangeSameAddress = (isSameAddress) => {
    setState({
      isSameAddress,
    })
  }

  return (
    <div className="content">
      <div className="inlineItems">
        <div>
          <button type="button" onClick={setInitialValues}>Set initial values to all forms</button><br /><br />
        </div>
        <div>
          <button type="button" onClick={clearFormsValues}>Clear forms values</button><br /><br />
        </div>
        <div>
          <button type="button" onClick={clearCreditCardFields}>Clear credit card fields</button>
        </div>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <PaymentMethods onChange={handleChangePaymentMethod} />
        <ShippingForm className="formSection" fields={shipping.fields} />
        {
          paymentMethod === 'creditCard' && (
            <div className="formSection">
              <label>
                <input type="checkbox" checked={isSameAddress} onChange={handleChangeSameAddress} />
                Same address
              </label>
            </div>
          )
        }
        {
          formGroup.forms.billing && (
            <BillingForm className="formSection" fields={billing.fields} />
          )
        }
        {
          formGroup.forms.creditCard && (
            <CreditCardForm className="formSection" fields={creditCard.fields} />
          )
        }
        <button className="submitButton" type="submit">Submit</button>
      </form>
    </div>
  )
}


export default PaymentPage
