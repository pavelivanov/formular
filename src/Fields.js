import Field from './Field'
import { asyncEvery } from './util'


class Fields {

  /**
   *
   * @param {Object} form
   * @param {Object} options
   * @param {Object} initialValues
   */
  constructor(form, options, initialValues = {}) {
    Object.keys(options).forEach((fieldName) => {
      const opts          = options[fieldName]
      const initialValue  = initialValues[fieldName]

      // TODO if we may move this into Field
      if (initialValue !== undefined) {
        opts.initialValue = initialValue
        opts.value = initialValue
      }

      this[fieldName] = new Field(form, fieldName, opts)
    })
  }

  /**
   *
   * @param {Object} values
   */
  setValues(values) {
    Object.keys(values).map((fieldName) => {
      const value = values[fieldName]
      const field = this[fieldName]

      if (field) {
        return field.set(value)
      }
    })
  }

  async validate() {
    const fieldNames  = Object.keys(this)
    const errors      = await Promise.all(fieldNames.map((fieldName) => this[fieldName].validate()))
    const isValid     = errors.every((error) => !error)

    return isValid
  }

  destroy() {
    // off handlers for form reset
  }
}


export default Fields
