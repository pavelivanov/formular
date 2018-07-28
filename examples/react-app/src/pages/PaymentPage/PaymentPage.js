import React, { Component } from 'react'
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
    const { sameAddress, paymentMethod } = this.state
    const { forms: { shipping, billing, creditCard } } = this.formsGroup

    return (
      <form className="form" onSubmit={this.handleSubmit}>
        <PaymentMethods onChange={this.handleChangePaymentMethod} />
        <ShippingForm className="formSection" fields={shipping.fields} />
        {
          paymentMethod === 'creditCard' && (
            <div className="formSection">
              <label>
                <input type="checkbox" checked={sameAddress} onChange={this.handleChangeSameAddress} />
                Same address
              </label>
            </div>
          )
        }
        {
          billing && (
            <BillingForm className="formSection" fields={billing.fields} />
          )
        }
        {
          creditCard && (
            <CreditCardForm className="formSection" fields={creditCard.fields} />
          )
        }
        <button className="submitButton" type="submit">Submit</button>
      </form>
    )
  }
}
