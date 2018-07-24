import Fields from './Fields'


class Form {

  /**
   *
   * @param {Object} options
   * @param {Object} options.fields
   * @param {Function} options.initialValues
   */
  constructor(options) {
    this.initialOptions = options

    this.setup(options)
  }

  setup(options) {
    this.fields         = new Fields(options.fields, options.initialValues)
    this.isValid        = true
  }

  /**
   *
   * @param {Object} values
   */
  setInitialValues(values) {
    this.initialOptions.initialValues = values

    this.fields.setInitialValues(values)
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

  validate() {
    this.isValid = this.fields.validate()

    return this.isValid
  }

  reset() {
    this.fields.destroy()
    this.setup(this.initialOptions)

    return this
  }
}


export default Form
