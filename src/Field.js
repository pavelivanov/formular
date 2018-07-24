class Field {

  /**
   *
   * @param name
   * @param {Object|Array} options - can be object options or list of validators
   */
  constructor(name, options) {
    this.name         = name
    this.value        = options.value === undefined || options.value === null ? '' : options.value
    this.error        = null
    this.isChanged    = false
    this.isValid      = true

    this._validators = options.validate || options
  }

  validate() {
    let error

    if (this._validators && this._validators.length) {
      this._validators.some((validator) => {
        error = validator(this.value)

        // console.log('')
        // console.log('validator:', validator.name)
        // console.log('error:', error)

        return error
      })
    }

    this.isValid = !error
    this.error = error

    return this.isValid
  }

  set(value) {
    this.value = value
  }
}


export default Field
