import Events from './Events'


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
   * @param {Object|Array} opts - can be object opts or list of validators
   */
  constructor(form, name, opts) {
    this.form                       = form
    this.name                       = name
    this.value                      = opts.value === undefined || opts.value === null ? '' : opts.value
    this.initialValue               = this.value
    this.error                      = null
    this.isChanged                  = false
    this.isValidated                = false
    this.isChangedAfterValidation   = false
    this.isValid                    = true

    this._events                    = new Events()
    this._validators                = opts.validate || opts
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

    this._events.dispatch('validate', this.error)

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

      this._events.dispatch('change', this.value)
    }
  }

  unset() {
    this.value                      = this.initialValue
    this.error                      = null
    this.isChanged                  = false
    this.isValidated                = false
    this.isChangedAfterValidation   = false
    this.isValid                    = true

    this._events.dispatch('change', this.value)
  }

  on(eventName, handler) {
    this._events.subscribe(eventName, handler)
  }

  off(eventName, handler) {
    this._events.unsubscribe(eventName, handler)
  }
}


export default Field
