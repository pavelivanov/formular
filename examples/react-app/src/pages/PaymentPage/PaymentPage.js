import React, { Component } from 'react'
import { FormxGroup } from 'formx'
import { connect } from 'formx/react'
import { shipping, billing, creditCard } from '../../forms'

import PaymentMethods from './PaymentMethods'
import ShippingForm from './ShippingForm'
import BillingForm from './BillingForm'
import CreditCardForm from './CreditCardForm'


const getFormsGroup = (isSameAddress, paymentMethod) => {
  if (paymentMethod === 'payPal') {
    return {
      shipping,
    }
  }

  if (isSameAddress) {
    return {
      shipping,
      creditCard,
    }
  }

  return {
    shipping,
    billing,
    creditCard,
  }
}

const formGroup = new FormxGroup({})


class PaymentPage extends Component {

  constructor() {
    super()

    const sameAddress = false
    const paymentMethod = 'creditCard'

    this.state = {
      sameAddress,
      paymentMethod,
    }

    formGroup.replace(getFormsGroup(sameAddress, paymentMethod))
  }

  componentWillUpdate(nextProps, nextState) {
    const { sameAddress, paymentMethod } = this.state
    const { sameAddress: newSameAddress, paymentMethod: newPaymentMethod } = nextState

    if (sameAddress !== newSameAddress || paymentMethod !== newPaymentMethod) {
      formGroup.replace(getFormsGroup(newSameAddress, newPaymentMethod))
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
      })
  }

  /*

    1)  setState добавлен в каждый Field, т.е. поля независимы от родителей и обновляются сами.
        выходит что когда мы делаем form.setValues(), form.unsetValues(), etc нам не нужно заботиться о рендере родителя

    2)  на прмиере sameAddress - в данном компоненте нам нужно изменять UI состояние чекбокса, поэтому имеет место быть
        ререндер, но также мы изменяем formGroup. Здесь же добавлен connect, который при изменении formGroup вызывает
        ререндер. Выходит что при изменении sameAddress ререндер вызывается дважды...

   */

  render() {
    const { sameAddress, paymentMethod } = this.state
    const { forms: { shipping, billing, creditCard } } = formGroup

    console.log(444, formGroup)

    return (
      <form className="form" onSubmit={this.handleSubmit}>
        <div className="col col-6">
          <button type="button" onClick={this.setInitialValues}>Set initial values to all forms</button><br /><br />
        </div>
        <div className="col col-6">
          <button type="button" onClick={this.clearFormsValues}>Clear forms values</button><br /><br />
        </div>
        <div className="col col-12">
          <button type="button" onClick={this.clearCreditCardFields}>Clear credit card fields</button>
        </div>

        <hr />

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


export default connect(formGroup)(PaymentPage)
