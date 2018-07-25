import Fields from './Fields'
import Events from './Events'


class Form {

  /**
   *
   * @param {Object} options
   * @param {Object} options.fields
   * @param {Function} options.initialValues
   */
  constructor(options) {
    this.initialOptions = options
    this._events = new Events()

    this.setup(options)
  }

  setup(options) {
    this.fields         = new Fields(this, options.fields, options.initialValues)
    this.isValid        = true
  }

  /**
   *
   * @param {Object} values
   */
  setInitialValues(values) {
    this.initialOptions.initialValues = values

    this.fields.setValues(values)
  }

  /**
   *
   * @param {Object} values
   */
  setValues(values) {
    this.fields.setValues(values)
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

  triggerChange() {
    this.events.dispatch('change')
  }

  async validate() {
    this.isValid = await this.fields.validate()

    return this.isValid
  }

  async submit() {
    const isValid = await this.validate()

    if (!isValid) {
      const errors = this.getErrors()

      return Promise.reject(errors)
    }

    const values = this.getValues()

    return values
  }

  reset() {
    this.fields.destroy()
    this.setup(this.initialOptions)

    return this
  }

  on(eventName, handler) {
    this._events.subscribe(eventName, handler)
  }

  off(eventName, handler) {
    this._events.unsubscribe(eventName, handler)
  }
}


export default Form
