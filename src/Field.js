const asyncSome = async (arr, calle) => {
  if (arr.length) {
    const [ item, ...restItems ] = arr
    const isMatch = await calle(item)

    if (isMatch) {
      return true
    }

    return asyncSome(restItems, calle)
  }

  return false
}


class Field {

  /**
   *
   * @param form
   * @param name
   * @param {Object|Array} options - can be object options or list of validators
   */
  constructor(form, name, options) {
    this.form                       = form
    this.name                       = name
    this.value                      = options.value === undefined || options.value === null ? '' : options.value
    this.error                      = null
    this.isChanged                  = false
    this.isValidated                = false
    this.isChangedAfterValidation   = false
    this.isValid                    = true

    this._validators = options.validate || options
  }

  async validate() {
    // if field value not changed from previous validation then return previous validation result
    if (this.isValidated && !this.isChangedAfterValidation) {
      return this.error
    }

    let error

    if (this._validators && this._validators.length) {
      await asyncSome(this._validators, async (validator) => {
        error = await validator(this.value)

        return Boolean(error)
      })
    }

    this.isValidated = true
    this.isChangedAfterValidation = false
    this.isValid = !error
    this.error = error

    return error
  }

  async set(value) {
    if (value !== this.value) {
      this.value = value
      this.isChanged = true

      // if field has already been validated then validate it on every change
      if (this.isValidated) {
        this.isChangedAfterValidation = true
        await this.validate()
      }
    }
  }
}


export default Field
