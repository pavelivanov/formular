import React, { Component } from 'react'
import paymentForm from '../forms/payment'


console.log(paymentForm)

export default class PaymentForm extends Component {

  reload = () => {
    this.forceUpdate()
  }

  handleChange = (formName, fieldName, event) => {
    paymentForm.forms[formName].fields[fieldName].set(event.target.value)
    this.reload()
  }

  handleSubmit = (event) => {
    event.preventDefault()

    console.log('values', paymentForm.getValues())

    paymentForm.submit()
      .then((values) => {
        console.log('values', values)
        this.reload()
      }, (errors) => {
        console.log('errors', errors)
        this.reload()
      })
  }
  
  renderShippingForm() {
    
    return (
      <div className="formSection">
        <div className="field">
          <input
            placeholder="Address"
            value={paymentForm.forms.shipping.fields.address.value}
            onChange={this.handleChange.bind(this, 'shipping', 'address')}
          />
          {
            Boolean(paymentForm.forms.shipping.fields.address.error) && (
              <span className="error">{paymentForm.forms.shipping.fields.address.error}</span>
            )
          }
        </div>
        <div className="field">
          <input
            placeholder="Telephone"
            value={paymentForm.forms.shipping.fields.telephone.value}
            onChange={this.handleChange.bind(this, 'shipping', 'telephone')}
          />
        </div>
      </div>
    )
  }
  
  renderBillingForm() {
    return (
      <div className="formSection">
        <div className="field">
          <input
            placeholder="Address"
            value={paymentForm.forms.billing.fields.address.value}
            onChange={this.handleChange.bind(this, 'billing', 'address')}
          />
          {
            Boolean(paymentForm.forms.billing.fields.address.error) && (
              <span className="error">{paymentForm.forms.billing.fields.address.error}</span>
            )
          }
        </div>
        <div className="field">
          <input
            placeholder="Telephone"
            value={paymentForm.forms.billing.fields.telephone.value}
            onChange={this.handleChange.bind(this, 'billing', 'telephone')}
          />
        </div>
      </div>
    )
  }

  renderCreditCardForm() {

    return (
      <div className="formSection">
        <div className="field">
          <input
            placeholder="Card Number"
            value={paymentForm.forms.creditCard.fields.cardNumber.value}
            onChange={this.handleChange.bind(this, 'creditCard', 'cardNumber')}
          />
          {
            Boolean(paymentForm.forms.creditCard.fields.cardNumber.error) && (
              <span className="error">{paymentForm.forms.creditCard.fields.cardNumber.error}</span>
            )
          }
        </div>
      </div>
    )
  }

  render() {

    return (
      <form className="form" onSubmit={this.handleSubmit}>
        {this.renderShippingForm()}
        {this.renderBillingForm()}
        {this.renderCreditCardForm()}
        <button className="submitButton" type="submit">Submit</button>
      </form>
    )
  }
}
