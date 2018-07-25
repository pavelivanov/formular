import React, { Component } from 'react'
import shippingForm from '../forms/shipping'


export default class ShippingForm extends Component {

  reload = () => {
    this.forceUpdate()
  }

  handleChange = (name, event) => {
    shippingForm.fields[name].set(event.target.value)
    this.reload()
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
          <input
            placeholder="Address"
            value={shippingForm.fields.address.value}
            onChange={this.handleChange.bind(this, 'address')}
          />
          {
            Boolean(shippingForm.fields.address.error) && (
              <span className="error">{shippingForm.fields.address.error}</span>
            )
          }
        </div>
        <div className="field">
          <input
            placeholder="Telephone"
            value={shippingForm.fields.telephone.value}
            onChange={this.handleChange.bind(this, 'telephone')}
          />
        </div>
        <button className="submitButton" type="submit">Submit</button>
      </form>
    )
  }
}
