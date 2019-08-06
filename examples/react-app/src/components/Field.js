import React, { useReducer } from 'react'
import PropTypes from 'prop-types'
import { Input } from 'formular/react/tags'


const Field = ({ field, placeholder, readOnly }) => {
  const [ state, setState ] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { isValidationProcess: false, error: field.error || null }
  )

  const { isValidationProcess, error } = state

  const handleStartValidate = () => {
    setState({
      isValidationProcess: true,
    })
  }

  const handleValidate = (error) => {
    setState({
      isValidationProcess: false,
      error,
    })
  }

  return (
    <div className="field">
      <div className="inputRelativeWrapper">
        {
          isValidationProcess && (
            <div className="spinner" />
          )
        }
        <Input
          className={error ? 'withError' : ''}
          field={field}
          placeholder={placeholder}
          onStartValidate={handleStartValidate}
          onValidate={handleValidate}
          readOnly={readOnly}
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