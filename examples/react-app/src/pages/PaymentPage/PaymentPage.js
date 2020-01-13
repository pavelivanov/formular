import React, { useMemo, useCallback, useReducer } from 'react'
import { Form, FormGroup } from 'formular'
import { required, cardNumber, expDate, cardCVV, streetAddress, minLength, zipCode, telephone,
  successAsyncValidation } from '../../helpers/validation'

import PaymentMethods from './PaymentMethods'
import ShippingForm from './ShippingForm'
import BillingForm from './BillingForm'
import CreditCardForm from './CreditCardForm'


const PaymentPage = () => {
  const [ state, setState ] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { isSameAddress: false, paymentMethod: 'creditCard' }
  )

  const { isSameAddress, paymentMethod } = state

  const shippingForm = useMemo(() => new Form({
    fields: {
      firstName: [ required ],
      lastName: [ required ],
      street: {
        validate: [ required, successAsyncValidation, streetAddress ],
        hasAsyncValidators: true,
      },
      apt: [],
      zipCode: [ required, zipCode ],
      city: [ required, minLength(3) ],
      state: [ required ],
      country: {
        validate: [ required ],
        value: 'United States',
      },
      telephone: [ telephone ],
    },
  }), [])

  const billingForm = useMemo(() => new Form({
    fields: {
      firstName: [ required ],
      lastName: [ required ],
      street: {
        validate: [ required, streetAddress ],
        hasAsyncValidators: true,
      },
      apt: [],
      zipCode: [ required, zipCode ],
      city: [ required, minLength(3) ],
      state: [ required ],
      country: {
        validate: [ required ],
        value: 'United States',
      },
    },
  }), [])

  const creditCardForm = useMemo(() => new Form({
    fields: {
      cardNumber: [ required, cardNumber ],
      holderName: [ required ],
      expDate: [ required, expDate ],
      cvc: [ required, cardCVV ],
    },
  }), [])

  const formGroup = useMemo(() => {
    let forms

    if (paymentMethod === 'payPal') {
      forms = {
        shipping: shippingForm,
      }
    }
    else if (isSameAddress) {
      forms = {
        shipping: shippingForm,
        creditCard: creditCardForm,
      }
    }
    else {
      forms = {
        shipping: shippingForm,
        billing: billingForm,
        creditCard: creditCardForm,
      }
    }

    return new FormGroup(forms)
  }, [ isSameAddress, paymentMethod ])

  const setInitialValues = useCallback(() => {
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
  }, [])

  const handleChangePaymentMethod = useCallback((paymentMethod) => {
    setState({ paymentMethod })
  }, [])

  const handleChangeSameAddress = useCallback((event) => {
    setState({ isSameAddress: event.target.checked })
  }, [])

  const clearFormsValues = useCallback(() => {
    formGroup.unsetValues()
  }, [ formGroup ])

  const clearCreditCardFields = useCallback(() => {
    formGroup.unsetValues()
  }, [ formGroup ])

  const handleSubmit = useCallback((event) => {
    event.preventDefault()

    formGroup.submit()
      .then((values) => {
        console.log('values', values)
      }, (errors) => {
        console.error('errors', errors)
      })
  }, [ formGroup ])

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
        <PaymentMethods value={paymentMethod} onChange={handleChangePaymentMethod} />
        <ShippingForm className="formSection" fields={shippingForm.fields} />
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
          paymentMethod !== 'payPal' && (
            <BillingForm className="formSection" fields={billingForm.fields} />
          )
        }
        {
          paymentMethod !== 'payPal' && !isSameAddress && (
            <CreditCardForm className="formSection" fields={creditCardForm.fields} />
          )
        }
        <button className="submitButton" type="submit">Submit</button>
      </form>
    </div>
  )
}


export default PaymentPage
