import Events from './Events'
import { asyncSome, debounce, CancelablePromise } from './util'


class Field {

  static modifyValue(value) {
    return value === undefined || value === null ? '' : value
  }

  /**
   *
   * @param name
   * @param {Object|Array} opts - can be object opts or list of validators
   */
  constructor(name, opts, form) {
    this._events = new Events()

    this.form                 = form
    this.node                 = opts.node
    this.name                 = name
    this.validators           = opts.validate || []
    this.value                = Field.modifyValue(opts.value)
    this.initialValue         = this.value
    this.error                = null
    this.isChanged            = false
    this.isValidating         = false
    this.isValidated          = false
    this.isValid              = true
    this.validateAfterChange  = opts.validateAfterChange === undefined ? true : opts.validateAfterChange // validate on every change after blur
    this.cancelablePromise    = null
    this.hasAsyncValidators   = opts.hasAsyncValidators

    // TODO how to detect this?
    // this.hasAsyncValidators = this.validators.some((validator) => (
    //   validator.constructor.name === 'AsyncFunction'
    // ))

    this.debounceValidate = this.hasAsyncValidators ? debounce(this.validate, 90) : this.validate
  }

  getState() {
    return {
      value: this.value,
      error: this.error,
      isChanged: this.isChanged,
      isValidating: this.isValidating,
      isValidated: this.isValidated,
      isValid: this.isValid,
    }
  }

  setRef(node) {
    this.node = node

    if (this.node) {
      this.node.addEventListener('blur', this.handleBlur)
    }
  }

  unsetRef() {
    if (this.node) {
      this.node.removeEventListener('blur', this.handleBlur)
    }

    this.node = null
  }

  // Should be called only before first render
  setInitialValue(value) {
    const _value = Field.modifyValue(value)

    this.initialValue = _value
    // TODO we should call "change" event to update view... but looks like we don't need to call validation there...
    // this.set(value)
    if (!this.isChanged) {
      this.value = _value
    }
  }

  set(value) {
    if (value !== this.value) {
      this.value = Field.modifyValue(value)
      this.isChanged = true

      this._events.dispatch('change', this.value)
    }
  }

  unset() {
    this.value        = this.initialValue
    this.error        = null
    this.isChanged    = false
    this.isValidated  = false
    this.isValid      = true

    this._events.dispatch('unset', this.value)
  }

  updateValidators = (cb) => {
    this.validators = cb(this.validators)
  }

  validate = async () => {
    let error

    this._events.dispatch('start validate')

    this.isValidating = true

    if (this.validators && this.validators.length) {
      if (this.hasAsyncValidators) {
        if (this.cancelablePromise) {
          this.cancelablePromise.cancel()
        }

        this.cancelablePromise = new CancelablePromise(async (resolve) => {
          await asyncSome(this.validators, async (validator) => {
            error = await validator(this.value, this.form.fields) // error here is String error message
            return Boolean(error)
          })
          resolve()
        })

        return this.cancelablePromise.then(() => {
          this.isValidated = true
          this.isValid = !error
          this.setError(error)

          return error
        })
      }

      // TODO write tests for validators with async and plain methods
      this.validators.some((validator) => {
        error = validator(this.value, this.form.fields) // error here is String error message
        return Boolean(error)
      })

      this.isValidated = true
      this.isValid = !error
      this.setError(error)

      return error
    }

    // TODO remove duplicate code
    this.isValidating = false
    this.isValidated = true
    this.isValid = !error
    this.setError(error)

    return error
  }

  setError = (error) => {
    this.error = error
    this._events.dispatch('validate', this.error)
  }

  handleBlur = () => {
    this._events.dispatch('blur')
  }

  on(eventName, handler) {
    this._events.subscribe(eventName, handler)
  }

  off(eventName, handler) {
    this._events.unsubscribe(eventName, handler)
  }
}


export default Field
