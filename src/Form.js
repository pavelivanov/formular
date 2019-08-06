import Events from './Events'
import Field from './Field'


class Form {

  static defaultOptions = {
    initialValues: {},
  }

  /**
   *
   * @param {Object} opts
   * @param {string} opts.name
   * @param {Object} opts.fields
   * @param {Object} [opts.initialValues]
   */
  constructor(opts) {
    this._events = new Events()

    // protect from passing initialValues: null
    if (!opts.initialValues) {
      opts.initialValues = {}
    }

    this.name       = opts.name
    this.opts       = { ...Form.defaultOptions, ...opts }
    this.fields     = {}
    this.isChanged  = false // TODO connect to Field
    this.isValid    = true

    this.setupFields()
  }

  setupFields() {
    Object.keys(this.opts.fields).forEach((fieldName) => {
      let fieldOpts     = this.opts.fields[fieldName]
      const initialValue  = this.opts.initialValues[fieldName]

      fieldOpts = Array.isArray(fieldOpts) ? { validate: fieldOpts } : fieldOpts

      // TODO if we should move this into Field
      if (initialValue !== undefined) {
        fieldOpts.initialValue = initialValue
        fieldOpts.value = initialValue
      }

      const field = new Field(fieldName, fieldOpts, this)

      this.fields[fieldName] = field

      field.on('change', () => {
        this._events.dispatch('change', field)
      })

      field.on('blur', () => {
        this._events.dispatch('blur', field)
      })
    })
  }

  /**
   *
   * @param {Object} values
   */
  setInitialValues(values) {
    this.opts.initialValues = values

    // TODO should we be able to update initialValues w/o changing current values? (for example for resetting to these values)
    Object.keys(values).map((fieldName) => {
      const value = values[fieldName]
      const field = this.fields[fieldName]

      if (field) {
        return field.setInitialValue(value)
      }
    })
  }

  /**
   * Update fields with passed values
   *
   * @param {Object} values
   */
  setValues(values) {
    // TODO should we mark form as changed and validate it?
    Object.keys(values).forEach((fieldName) => {
      const value = values[fieldName]
      const field = this.fields[fieldName]

      if (field) {
        field.set(value === undefined || value === null ? '' : value)
      }
    })
  }

  getValues() {
    const values = {}

    Object.keys(this.fields).forEach((fieldName) => {
      const field = this.fields[fieldName]

      values[fieldName] = field.value
    })

    return values
  }

  unsetValues() {
    this.isChanged = false
    this.isValid = null

    Object.keys(this.fields).forEach((fieldName) => {
      const field = this.fields[fieldName]

      field.unset()
    })
  }

  getErrors() {
    const errors = {}

    Object.keys(this.fields).forEach((fieldName) => {
      const field = this.fields[fieldName]

      errors[fieldName] = field.error
    })

    return errors
  }

  async validate() {
    const promises  = Object.keys(this.fields).map((fieldName) => this.fields[fieldName].validate())
    const errors    = await Promise.all(promises)

    this.isValid = errors.every((error) => !error)

    return this.isValid
  }

  async submit() {
    // TODO don't validate if all fields are changed and valid
    await this.validate()

    if (!this.isValid) {
      const errors = this.getErrors()

      return Promise.reject(errors)
    }

    return this.getValues()
  }

  on(eventName, handler) {
    this._events.subscribe(eventName, handler)
  }

  off(eventName, handler) {
    this._events.unsubscribe(eventName, handler)
  }
}


export default Form
