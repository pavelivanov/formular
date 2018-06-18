import React, { Component } from 'react'
import Formx from './src'


const getForm = (_options, props) => {
  const options = typeof _options === 'function' ? _options(props) : _options

  return new ReduxForm(options)
}

const decorator = (options) => (ComposedComponent) => {

  let reduxForm

  class FormComponent extends Component {

    constructor(props) {
      super()

      reduxForm = getForm(options, props)

      this.state = {
        fieldValues: null,
      }
    }

    updateOptions = () => {
      reduxForm.updateOptions()
    }

    updateValues = () => {
      reduxForm.updateFieldValues()
    }

    render() {
      const { fieldValues } = this.state
      let fields

      fields = reduxForm.validate()

      return fieldValues && (
        <ComposedComponent
          {...this.props}
          {...this.state}
          fields={fields}
        />
      )
    }
  }
}


export default decorator
