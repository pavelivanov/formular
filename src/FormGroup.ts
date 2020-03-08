import { debounce } from './util/index'
import Events from './Events'
import Form from './Form'


const formEvents = [ 'change', 'set values', 'unset values' ]

type Obj = {
  [key: string]: any
}

type Forms = {
  [key: string]: Form<{}>
}

class FormGroup {

  private _events: Events
  forms: Forms

  constructor(forms: Forms) {
    this._events = new Events()
    this.forms = forms

    this._subscribe()
  }

  replace(newForms: Forms) {
    this._unsubscribe()

    this.forms = newForms

    this._subscribe()

    this._events.dispatch('replace')
  }

  // Private methods ------------------------------------ /

  _handleFormEvent = (eventName: string) => debounce(() => {
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

  async validate(): Promise<boolean> {
    const forms     = Object.values(this.forms)
    const statuses  = await Promise.all(forms.map((form) => form.validate()))
    const isValid   = statuses.every((isValid) => isValid)

    return isValid
  }

  setValues(values: Obj): void {
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

  getValues(): Obj {
    const formNames = Object.keys(this.forms)
    const values: Obj = {}

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      values[formName] = form.getValues()
    })

    return values
  }

  unsetValues(): void {
    const formNames = Object.keys(this.forms)

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      form.unsetValues()
    })

    this._events.dispatch('unset values')
  }

  // TODO looks like getValues() if we need rewrite it? Write getKeyValues(key)
  getErrors(): Obj {
    const formNames = Object.keys(this.forms)
    const errors: Obj = {}

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      errors[formName] = form.getErrors()
    })

    return errors
  }

  async submit(): Promise<object> {
    const isValid = await this.validate()

    if (!isValid) {
      const errors = this.getErrors()

      return Promise.reject(errors)
    }

    return this.getValues()
  }

  on(eventName: string, handler: Function): void {
    this._events.subscribe(eventName, handler)
  }

  off(eventName: string, handler: Function): void {
    this._events.unsubscribe(eventName, handler)
  }
}


export default FormGroup
