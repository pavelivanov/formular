import React, { Component } from 'react'
import { FormxGroup } from 'formx'
import { shippingForm, billingForm, creditCardForm } from '../forms'

import ShippingForm from '../components/ShippingForm'
import BillingForm from '../components/BillingForm'
import CreditCardForm from '../components/CreditCardForm'


const getFormsGroup = (isSameAddress) => {
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


export default class PaymentForm extends Component {

  componentWillMount() {
    this.formsGroup = getFormsGroup(false)
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

  handleChangeSameAddress = (event) => {
    this.formsGroup = getFormsGroup(event.target.checked)
    this.forceUpdate()
  }

  render() {

    return (
      <form className="form" onSubmit={this.handleSubmit}>
        <ShippingForm className="formSection" fields={shippingForm.fields} />
        <div className="formSection">
          <label>
            <input type="checkbox" onChange={this.handleChangeSameAddress} />
            Same address
          </label>
        </div>
        {
          this.formsGroup.forms.billing && (
            <BillingForm className="formSection" fields={billingForm.fields} />
          )
        }
        <CreditCardForm className="formSection" fields={creditCardForm.fields} />
        <button className="submitButton" type="submit">Submit</button>
      </form>
    )
  }
}
