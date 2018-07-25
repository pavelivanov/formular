import React from 'react'
import { Input } from 'formx/react/tags'


const Field = ({ field, placeholder }) => (
  <div className="field">
    <Input field={field} placeholder={placeholder} />
    {
      Boolean(field.error) && (
        <span className="error">{field.error}</span>
      )
    }
  </div>
)

export default Field
