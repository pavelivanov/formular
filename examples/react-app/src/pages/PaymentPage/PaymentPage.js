import React, { Component } from 'react'
import { FormxGroup } from 'formx'
import { shippingForm, billingForm, creditCardForm } from '../../forms'

import PaymentMethods from './PaymentMethods'
import ShippingForm from './ShippingForm'
import BillingForm from './BillingForm'
import CreditCardForm from './CreditCardForm'


const getFormsGroup = (isSameAddress, paymentMethod) => {
  if (paymentMethod === 'payPal') {
    return new FormxGroup({
      shipping: shippingForm,
    })
  }

  if (isSameAddress) {
    return new FormxGroup({
      shipping: shippingForm,
      creditCard: creditCardForm,
    })
  }

  return new FormxGroup({
    shipping: shippingForm,
    billing: billingForm,
    creditCard: creditCardForm,
  })
}


export default class PaymentPage extends Component {

  constructor() {
    super()

    const sameAddress = false
    const paymentMethod = 'creditCard'

    this.state = {
      sameAddress,
      paymentMethod,
    }

    this.formsGroup = getFormsGroup(sameAddress, paymentMethod)
  }

  componentWillUpdate(nextProps, nextState) {
    const { sameAddress, paymentMethod } = this.state
    const { sameAddress: newSameAddress, paymentMethod: newPaymentMethod } = nextState

    if (sameAddress !== newSameAddress || paymentMethod !== newPaymentMethod) {
      this.formsGroup = getFormsGroup(newSameAddress, newPaymentMethod)
    }
  }

  handleChangePaymentMethod = (paymentMethod) => {
    this.setState({
      paymentMethod,
    })
  }

  handleChangeSameAddress = (event) => {
    this.setState({
      sameAddress: event.target.checked,
    })
  }

  handleSubmit = (event) => {
    event.preventDefault()

    this.formsGroup.submit()
      .then((values) => {
        console.log('values', values)
      }, (errors) => {
        console.log('errors', errors)
        this.forceUpdate()
      })
  }

  render() {
    const { paymentMethod } = this.state

    return (
      <form className="form" onSubmit={this.handleSubmit}>
        <PaymentMethods onChange={this.handleChangePaymentMethod} />
        <ShippingForm className="formSection" fields={shippingForm.fields} />
        {
          paymentMethod === 'creditCard' && (
            <div className="formSection">
              <label>
                <input type="checkbox" onChange={this.handleChangeSameAddress} />
                Same address
              </label>
            </div>
          )
        }
        {
          this.formsGroup.forms.billing && (
            <BillingForm className="formSection" fields={billingForm.fields} />
          )
        }
        {
          this.formsGroup.forms.creditCard && (
            <CreditCardForm className="formSection" fields={creditCardForm.fields} />
          )
        }
        <button className="submitButton" type="submit">Submit</button>
      </form>
    )
  }
}
