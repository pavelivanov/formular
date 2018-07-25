import React, { Component } from 'react'
import shippingForm from '../forms/shipping'

import Field from '../components/Field'


export default class ShippingForm extends Component {

  componentDidMount() {
    shippingForm.on('change', this.reload)
  }

  componentWillUnmount() {
    shippingForm.off('change', this.reload)
  }

  reload = () => {
    this.forceUpdate()
  }

  handleSubmit = (event) => {
    event.preventDefault()

    console.log('values', shippingForm.getValues())

    shippingForm.submit()
      .then((values) => {
        console.log('values', values)
        this.reload()
      }, (errors) => {
        console.log('errors', errors)
        this.reload()
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
