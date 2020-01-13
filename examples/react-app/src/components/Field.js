import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useFieldState } from 'formular'


const Field = ({ field, placeholder, readOnly }) => {
  const { value, error, isValidating } = useFieldState(field)

  const handleChange = useCallback((event) => {
    field.set(event.target.value)
  }, [])

  return (
    <div className="field">
      <div className="inputRelativeWrapper">
        {
          isValidating && (
            <div className="spinner" />
          )
        }
        <input
          className={error ? 'withError' : ''}
          value={value}
          type="text"
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={handleChange}
        />
      </div>
      {
        Boolean(error) && (
          <span className="error">{error}</span>
        )
      }
    </div>
  )
}

Field.propTypes = {
  field: PropTypes.object.isRequired,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
}


export default Field
