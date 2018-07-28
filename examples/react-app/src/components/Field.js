import React, { Component } from 'react'
import { Input } from 'formx/react/tags'


export default class Field extends Component {

  constructor(props) {
    super()

    const { field } = props

    this.state = {
      error: field.error || null,
    }
  }

  handleValidate = (error) => {
    this.setState({
      error,
    })
  }

  render() {
    const { error } = this.state
    const { field, placeholder, readOnly } = this.props

    return (
      <div className="field">
        <Input
          className={error ? 'withError' : ''}
          field={field}
          placeholder={placeholder}
          onValidate={this.handleValidate}
          readOnly={readOnly}
        />
        {
          Boolean(error) && (
            <span className="error">{error}</span>
          )
        }
      </div>
    )
  }
}
