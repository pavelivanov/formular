import React, { Component } from 'react'
import shippingForm from '../forms/shipping'

import Field from '../components/Field'


export default class ShippingForm extends Component {

  handleSubmit = (event) => {
    event.preventDefault()

    console.log('values', shippingForm.getValues())

    shippingForm.submit()
      .then((values) => {
        console.log('values', values)
      }, (errors) => {
        console.log('errors', errors)
      })
  }

  render() {

    return (
      <form className="form" onSubmit={this.handleSubmit}>
        <Field field={shippingForm.fields.address} placeholder="Address" />
        <Field field={shippingForm.fields.telephone} placeholder="Telephone" />
        <button className="submitButton" type="submit">Submit</button>
      </form>
    )
  }
}
