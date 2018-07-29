import React, { Component } from 'react'
import { Input } from 'formx/react/tags'


export default class Field extends Component {

  constructor(props) {
    super()

    const { field } = props

    this.state = {
      isValidationProcess: false,
      error: field.error || null,
    }
  }

  handleStartValidate = () => {
    this.setState({
      isValidationProcess: true,
    })
  }

  handleValidate = (error) => {
    this.setState({
      isValidationProcess: false,
      error,
    })
  }

  render() {
    const { isValidationProcess, error } = this.state
    const { field, placeholder, readOnly } = this.props

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
            onStartValidate={this.handleStartValidate}
            onValidate={this.handleValidate}
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
}
