import Field from './Field'


class Fields {

  /**
   *
   * @param {Object} options
   * @param {Object} initialValues
   */
  constructor(options, initialValues = {}) {
    Object.keys(options).forEach((fieldName) => {
      const opts          = options[fieldName]
      const initialValue  = initialValues[fieldName]

      // TODO if we may move this into Field
      if (initialValue !== undefined) {
        opts.value = initialValue
      }

      this[fieldName] = new Field(fieldName, opts)
    })
  }

  /**
   *
   * @param {Object} values
   */
  setInitialValues(values) {
    Object.keys(values).forEach((fieldName) => {
      const value = values[fieldName]
      const field = this[fieldName]

      if (field) {
        field.set(value)
      }
    })
  }

  validate() {
    return Object.keys(this).every((fieldName) => {
      const error = this[fieldName].validate()

      return !error
    })
  }

  destroy() {
    // off handlers for form reset
  }
}


export default Fields
