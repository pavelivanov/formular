import React, { Component } from 'react'
import { Input } from 'formx/react/tags'


export default class Field extends Component {

  state = {
    error: null,
  }

  handleValidate = (error) => {
    this.setState({
      error,
    })
  }

  render() {
    const { error } = this.state
    const { field, placeholder } = this.props

    return (
      <div className="field">
        <Input field={field} placeholder={placeholder} onValidate={this.handleValidate} />
        {
          Boolean(error) && (
            <span className="error">{error}</span>
          )
        }
      </div>
    )
  }
}
