import React, { Component } from 'react'
import shippingForm from '../forms/shipping'
import { Input } from 'formx/react/tags'


export default class ShippingForm extends Component {

  componentDidMount() {
    shippingForm.on('change', () => {
      this.reload()
    })
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
        <div className="field">
          <Input field={shippingForm.fields.address} placeholder="Address" />
          {
            Boolean(shippingForm.fields.address.error) && (
              <span className="error">{shippingForm.fields.address.error}</span>
            )
          }
        </div>
        <div className="field">
          <Input field={shippingForm.fields.telephone} placeholder="Telephone" />
          {
            Boolean(shippingForm.fields.telephone.error) && (
              <span className="error">{shippingForm.fields.telephone.error}</span>
            )
          }
        </div>
        <button className="submitButton" type="submit">Submit</button>
      </form>
    )
  }
}
