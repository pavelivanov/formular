import React, { Component } from 'react'
import { FormxGroup } from 'formx'
import { shippingForm, billingForm, creditCardForm } from '../forms'

import Field from '../components/Field'


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

  componentDidMount() {
    this.formsGroup.on('change', this.reload)
  }

  componentWillUnmount() {
    this.formsGroup.off('change', this.reload)
  }

  reload = () => {
    this.forceUpdate()
  }

  handleSubmit = (event) => {
    event.preventDefault()

    console.log('values', this.formsGroup.getValues())

    this.formsGroup.submit()
      .then((values) => {
        console.log('values', values)
        this.reload()
      }, (errors) => {
        console.log('errors', errors)
        this.reload()
      })
  }

  handleChangeSameAddress = (event) => {
    this.formsGroup = getFormsGroup(event.target.checked)
    this.reload()
  }
  
  renderShippingForm() {
    
    return (
      <div className="formSection">
        <Field field={shippingForm.fields.address} placeholder="Address" />
        <Field field={shippingForm.fields.telephone} placeholder="Telephone" />
      </div>
    )
  }
  
  renderBillingForm() {
    if (!this.formsGroup.forms.billing) {
      return null
    }

    return (
      <div className="formSection">
        <Field field={billingForm.fields.address} placeholder="Address" />
        <Field field={billingForm.fields.telephone} placeholder="Telephone" />
      </div>
    )
  }

  renderCreditCardForm() {

    return (
      <div className="formSection">
        <Field field={creditCardForm.fields.cardNumber} placeholder="Card number" />
      </div>
    )
  }

  render() {

    return (
      <form className="form" onSubmit={this.handleSubmit}>
        {this.renderShippingForm()}
        <div className="formSection">
          <label>
            <input type="checkbox" onChange={this.handleChangeSameAddress} />
            Same address
          </label>
        </div>
        {this.renderBillingForm()}
        {this.renderCreditCardForm()}
        <button className="submitButton" type="submit">Submit</button>
      </form>
    )
  }
}
