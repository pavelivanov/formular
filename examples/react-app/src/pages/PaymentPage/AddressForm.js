import React, { PureComponent } from 'react'

import Field from '../../components/Field'


class AddressForm extends PureComponent {

  render() {
    const { className, fields, withTelephone } = this.props

    return (
      <div className={`row ${className}`}>
        <div className="col col-6">
          <Field field={fields.firstName} placeholder="First name" />
        </div>
        <div className="col col-6">
          <Field field={fields.lastName} placeholder="Last name" />
        </div>
        <div className="col col-8">
          <Field field={fields.street} placeholder="Street address" />
        </div>
        <div className="col col-4">
          <Field field={fields.apt} placeholder="Apt (optional)" />
        </div>
        <div className="col col-4">
          <Field field={fields.zipCode} placeholder="Zip" />
        </div>
        <div className="col col-4">
          <Field field={fields.city} placeholder="City" />
        </div>
        <div className="col col-4">
          <Field field={fields.state} placeholder="State" />
        </div>
        <div className="col col-6">
          <Field field={fields.country} placeholder="Country" readOnly />
        </div>
        {
          withTelephone && (
            <div className="col col-6">
              <Field field={fields.telephone} placeholder="Telephone (optional)" />
            </div>
          )
        }
      </div>
    )
  }
}


export default AddressForm
