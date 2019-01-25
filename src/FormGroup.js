import Events from './Events'
import { debounce } from './util'


const formEvents = [ 'change', 'set values', 'unset values' ]

class FormGroup {

  /**
   *
   * @param {Object} forms
   */
  constructor(forms) {
    this.forms = forms
    this._events = new Events()

    this._subscribe()
  }

  /**
   * Replace old forms with new
   *
   * @param {Object} newForms
   */
  replace(newForms) {
    this._unsubscribe()

    this.forms = newForms

    this._subscribe()

    this._events.dispatch('replace')
  }

  // Private methods ------------------------------------ /

  _handleFormEvent = (eventName) => debounce(() => {
    this._events.dispatch(eventName)
  }, 100)

  _subscribe() {
    const forms = Object.values(this.forms)

    forms.forEach((form) => {
      formEvents.forEach((eventName) => {
        form.on(eventName, this._handleFormEvent(eventName))
      })
    })
  }

  _unsubscribe() {
    const forms = Object.values(this.forms)

    forms.forEach((form) => {
      formEvents.forEach((eventName) => {
        form.off(eventName, this._handleFormEvent(eventName))
      })
    })
  }

  // Public methods ------------------------------------- /

  async validate() {
    const forms     = Object.values(this.forms)
    const statuses  = await Promise.all(forms.map((form) => form.validate()))
    const isValid   = statuses.every((isValid) => isValid)

    return isValid
  }

  setValues(values) {
    const formNames = Object.keys(this.forms)

    formNames.forEach((formName) => {
      const form        = this.forms[formName]
      const formValues  = values[formName]

      if (formValues) {
        form.setValues(formValues)
      }
    })

    this._events.dispatch('set values')
  }

  getValues() {
    const formNames = Object.keys(this.forms)
    const values = {}

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      values[formName] = form.getValues()
    })

    return values
  }

  unsetValues() {
    const formNames = Object.keys(this.forms)

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      form.unsetValues()
    })

    this._events.dispatch('unset values')
  }

  // TODO looks like getValues() if we need rewrite it? Write getKeyValues(key)
  getErrors() {
    const formNames = Object.keys(this.forms)
    const errors = {}

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      errors[formName] = form.getErrors()
    })

    return errors
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

  /**
   *
   * @param {string} eventName
   * @param {function} handler
   */
  on(eventName, handler) {
    this._events.subscribe(eventName, handler)
  }

  /**
   *
   * @param {string} eventName
   * @param {function} handler
   */
  off(eventName, handler) {
    this._events.unsubscribe(eventName, handler)
  }
}

export default FormGroup
