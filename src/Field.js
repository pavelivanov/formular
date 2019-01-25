import Events from './Events'
import { asyncSome, debounce, CancelablePromise } from './util'


class Field {

  /**
   *
   * @param name
   * @param {Object|Array} opts - can be object opts or list of validators
   */
  constructor(name, opts) {
    this._events              = new Events()

    this.name                 = name
    this.validators           = opts.validate || opts
    this.value                = opts.value === undefined || opts.value === null ? '' : opts.value
    this.initialValue         = this.value
    this.error                = null
    this.isChanged            = false
    this.isValidated          = false
    this.isValid              = true
    this.cancelablePromise    = null
    this.hasAsyncValidators   = true

    // TODO how to detect this?
    // this.hasAsyncValidators = this.validators.some((validator) => (
    //   validator.constructor.name === 'AsyncFunction'
    // ))

    this.debounceValidate = this.hasAsyncValidators ? debounce(this.validate, 120) : this.validate
  }

  setInitialValue(value) {
    this.initialValue = value
    // TODO we should call "change" event to update view... but looks like we don't need to call validation there...
    this.set(value)
  }

  set(value) {
    if (value !== this.value) {
      this.value = value
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

    this._events.dispatch('change', this.value)
  }

  validate = async () => {
    let error

    this._events.dispatch('start validate')

    if (this.validators && this.validators.length) {
      if (this.hasAsyncValidators) {
        if (this.cancelablePromise) {
          this.cancelablePromise.cancel()
        }

        this.cancelablePromise = new CancelablePromise(async (resolve) => {
          await asyncSome(this.validators, async (validator) => {
            error = await validator(this.value) // error here is String error message
            return Boolean(error)
          })
          resolve()
        })

        return this.cancelablePromise.then(() => {
          this.isValidated = true
          this.isValid = !error
          this.error = error

          this._events.dispatch('validate', this.error)

          return error
        })
      }
      else {
        // TODO write tests for validators with async and plain methods
        this.validators.some((validator) => {
          error = validator(this.value) // error here is String error message
          return Boolean(error)
        })

        this.isValidated = true
        this.isValid = !error
        this.error = error

        this._events.dispatch('validate', this.error)

        return error
      }
    }
    else {
      // TODO remove duplicate code
      this.isValidated = true
      this.isValid = !error
      this.error = error

      this._events.dispatch('validate', this.error)

      return error
    }
  }

  on(eventName, handler) {
    this._events.subscribe(eventName, handler)
  }

  off(eventName, handler) {
    this._events.unsubscribe(eventName, handler)
  }
}


export default Field
