import Fields from './Fields'


class Form {

  /**
   *
   * @param {Object} options
   * @param {Object} options.fields
   * @param {Function} options.initialValues
   */
  constructor(options) {
    this.fields = new Fields(options.fields)
    this.isValid = true
  }

  validate() {
    this.isValid = this.fields.validate()

    return this.isValid
  }

  getValues() {
    const fieldNames = Object.keys(this.fields)
    const values = {}

    fieldNames.forEach((fieldName) => {
      const field = this.fields[fieldName]

      values[fieldName] = field.value
    })

    return values
  }

  getErrors() {
    const fieldNames = Object.keys(this.fields)
    const errors = {}

    fieldNames.forEach((fieldName) => {
      const field = this.fields[fieldName]

      errors[fieldName] = field.error
    })

    return errors
  }
}


export default Form
