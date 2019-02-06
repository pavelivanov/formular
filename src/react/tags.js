import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'


const Input = ({ field, onStartValidate, onValidate, ...rest }) => {
  const [ value, setValue ] = useState(field.value || '')

  useEffect(() => {
    field.on('start validate', handleFieldStartValidate)
    field.on('validate', handleFieldValidate)
    field.on('change', handleFieldChange)
    
    return () => {
      field.off('start validate', handleFieldStartValidate)
      field.off('validate', handleFieldValidate)
      field.off('change', handleFieldChange)
    }
  })

  const handleFieldStartValidate = () => {
    if (typeof onStartValidate === 'function') {
      onStartValidate()
    }
  }

  const handleFieldValidate = (error) => {
    if (typeof onValidate === 'function') {
      onValidate(error)
    }
  }

  const handleFieldChange = (value) => {
    setValue(value)
  }

  const handleInputChange = (event) => {
    const value = event.target.value

    field.set(value)
    field.debounceValidate()
  }

  return (
    <input
      type="text"
      {...rest}
      value={value}
      onChange={handleInputChange}
    />
  )
}

Input.propTypes = {
  field: PropTypes.object.isRequired,
  value: PropTypes.string,
  onValidate: PropTypes.func,
}


export {
  Input,
}
