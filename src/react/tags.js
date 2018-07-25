import React, { Component } from 'react'
import PropTypes from 'prop-types'


class Input extends Component {

  static propTypes = {
    field: PropTypes.object.isRequired,
    value: PropTypes.string,
    onValidate: PropTypes.func,
  }

  constructor(props) {
    super()

    const { value } = props

    this.state = {
      value: value || '',
    }
  }

  componentWillMount() {
    const { field } = this.props

    field.on('validate', this.handleValidate)
  }

  componentWillUnmount() {
    const { field } = this.props

    field.off('validate', this.handleValidate)
  }

  handleValidate = (error) => {
    const { onValidate } = this.props

    if (typeof onValidate === 'function') {
      onValidate(error)
    }
  }

  handleChange = async (event) => {
    const { field } = this.props
    const value = event.target.value

    await field.set(value)

    this.setState({
      value,
    })
  }

  handleBlur = async () => {
    const { field } = this.props

    await field.validate()
  }

  render() {
    const { value } = this.state
    const { field, onValidate, ...rest } = this.props

    return (
      <input
        {...rest}
        type="text"
        value={value}
        onChange={this.handleChange}
        onBlur={this.handleBlur}
      />
    )
  }
}


export {
  Input,
}
