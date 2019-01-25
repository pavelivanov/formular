import React, { Fragment, Component } from 'react'
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

let formGroup = new FormxGroup({})


export default class PaymentPage extends Component {

  constructor() {
    super()

    const sameAddress = false
    const paymentMethod = 'creditCard'

    this.state = {
      sameAddress,
      paymentMethod,
    }

    formGroup = getFormsGroup(sameAddress, paymentMethod)
  }

  componentWillUpdate(nextProps, nextState) {
    const { sameAddress, paymentMethod } = this.state
    const { sameAddress: newSameAddress, paymentMethod: newPaymentMethod } = nextState

    if (sameAddress !== newSameAddress || paymentMethod !== newPaymentMethod) {
      formGroup = getFormsGroup(newSameAddress, newPaymentMethod)
    }
  }

  setInitialValues = () => {
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

  clearFormsValues = () => {
    formGroup.unsetValues()
  }

  clearCreditCardFields = () => {
    formGroup.forms.creditCard.unsetValues()
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

    formGroup.submit()
      .then((values) => {
        console.log('values', values)
      }, (errors) => {
        console.log('errors', errors)
        this.forceUpdate()
      })
  }

  render() {
    const { sameAddress, paymentMethod } = this.state

    console.log('render() sameAddress: ', sameAddress)
    console.log('render() paymentMethod: ', paymentMethod)

    return (
      <div className="content">
        <div className="inlineItems">
          <div>
            <button type="button" onClick={this.setInitialValues}>Set initial values to all forms</button><br /><br />
          </div>
          <div>
            <button type="button" onClick={this.clearFormsValues}>Clear forms values</button><br /><br />
          </div>
          <div>
            <button type="button" onClick={this.clearCreditCardFields}>Clear credit card fields</button>
          </div>
        </div>
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
      </div>
    )
  }
}
