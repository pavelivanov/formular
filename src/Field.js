import CancelablePromise from 'cancelable-promise'

import Events from './Events'
import { asyncSome, debounce } from './util'


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
    // this.isChangedAfterValidation   = false
    this.isValid                    = true

    this._events                    = new Events()
    this._validators                = opts.validate || opts
  }

  validate = async () => {
    // if field value not changed from previous validation then return previous validation result
    // if (this.isValidated && !this.isChangedAfterValidation) {
    //   return this.error
    // }

    let error

    this._events.dispatch('start validate')

    if (this._validators && this._validators.length) {
      if (this.cancelablePromise) {
        this.cancelablePromise.cancel()
      }

      this.cancelablePromise = new CancelablePromise(async (resolve) => {
        await asyncSome(this._validators, async (validator) => {
          error = await validator(this.value) // error here is String error message
          return Boolean(error)
        })
        resolve()
      })

      return this.cancelablePromise.then(() => {
        // this.isChangedAfterValidation = false
        this.isValidated = true
        this.isValid = !error
        this.error = error

        this._events.dispatch('validate', this.error)

        return error
      })
    }
    else {
      // TODO remove duplicate code
      // this.isChangedAfterValidation = false
      this.isValidated = true
      this.isValid = !error
      this.error = error

      this._events.dispatch('validate', this.error)

      return error
    }
  }

  debounceValidate = debounce(this.validate, 200)

  set(value) {
    if (value !== this.value) {
      this.value = value
      this.isChanged = true

      this._events.dispatch('change', this.value)

      // if field has already been validated then validate it on every change
      // if (this.isValidated) {
      //   this.isChangedAfterValidation = true
      //
      //   this.validate()
      // }
    }
  }

  unset() {
    this.value                      = this.initialValue
    this.error                      = null
    this.isChanged                  = false
    this.isValidated                = false
    // this.isChangedAfterValidation   = false
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
