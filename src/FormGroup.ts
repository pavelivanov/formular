import { debounce } from './util/index'
import Events from './Events'
import Form, { eventNames as formEventNames, FormEventName } from './Form'


const eventNames = {
  replace: 'replace',
  setValues: 'set values',
  unsetValues: 'unset values',
  attachForms: 'attach forms',
  detachForms: 'detach forms',
} as const

export type FormGroupEventName = typeof eventNames[keyof typeof eventNames]

type FormFieldValues = {
  [key: string]: any
}

type FormsValues<Forms> = {
  [K in keyof Forms]: any
}

class FormGroup<Forms extends { [key: string]: FormFieldValues }> {

  private _events: Events<FormGroupEventName | FormEventName>
  forms: Forms

  constructor(forms?: Forms) {
    this._events = new Events<FormGroupEventName | FormEventName>()
    // @ts-ignore
    this.forms = forms || {}

    this._subscribe()
  }

  private _handleFormEvent = (eventName: FormEventName) => debounce(() => {
    this._events.dispatch(eventName)
  }, 100)

  private _subscribe() {
    const forms = Object.values(this.forms) as Array<Form<any>>

    forms.forEach((form) => {
      const eventNames = Object.keys(formEventNames) as FormEventName[]

      eventNames.forEach((eventName) => {
        form.on(eventName, this._handleFormEvent(eventName))
      })
    })
  }

  private _unsubscribe() {
    const forms = Object.values(this.forms) as Array<Form<any>>

    forms.forEach((form) => {
      const eventNames = Object.keys(formEventNames) as FormEventName[]

      eventNames.forEach((eventName) => {
        form.off(eventName, this._handleFormEvent(eventName))
      })
    })
  }

  attachForms(forms: Partial<Forms>): void {
    const formNames = Object.keys(forms) as Array<keyof Forms>

    formNames.forEach((formName) => {
      if (formName in this.forms) {
        console.error(`Form with name "${formName}" already exists in FormGroup`)
      }
      else {
        this.forms[formName] = forms[formName] as any
      }
    })

    this._events.dispatch(eventNames.attachForms)
  }

  detachForms(formNames: Array<keyof Forms>): void {
    formNames.forEach((fieldName) => {
      delete this.forms[fieldName]
    })

    this._events.dispatch(eventNames.detachForms)
  }

  replace(newForms: Forms) {
    this._unsubscribe()

    this.forms = newForms

    this._subscribe()
    this._events.dispatch(eventNames.replace)
  }

  async validate(): Promise<boolean> {
    const forms     = Object.values(this.forms) as Array<Forms[keyof Forms]>
    const statuses  = await Promise.all(forms.map((form) => form.validate()))
    const isValid   = statuses.every((isValid) => isValid)

    return isValid
  }

  setValues(values: FormsValues<Forms>): void {
    const formNames = Object.keys(this.forms) as Array<keyof Forms>

    formNames.forEach((formName) => {
      const form        = this.forms[formName]
      const formValues  = values[formName]

      if (formValues) {
        form.setValues(formValues)
      }
    })

    this._events.dispatch('set values')
  }

  getValues(): FormsValues<Forms> {
    const formNames = Object.keys(this.forms) as Array<keyof Forms>
    const values = {} as FormsValues<Forms>

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      values[formName] = form.getValues()
    })

    return values
  }

  unsetValues(): void {
    const formNames = Object.keys(this.forms) as Array<keyof Forms>

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      form.unsetValues()
    })

    this._events.dispatch('unset values')
  }

  // TODO looks like getValues() if we need rewrite it? Write getKeyValues(key)
  getErrors(): FormsValues<Forms> {
    const formNames = Object.keys(this.forms) as Array<keyof Forms>
    const errors = {} as FormsValues<Forms>

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      errors[formName] = form.getErrors()
    })

    return errors
  }

  async submit(): Promise<FormsValues<Forms>> {
    const isValid = await this.validate()

    if (!isValid) {
      const errors = this.getErrors()

      return Promise.reject(errors)
    }

    return this.getValues()
  }

  on(eventName: FormGroupEventName | FormEventName, handler: Function): void {
    this._events.subscribe(eventName, handler)
  }

  off(eventName: FormGroupEventName | FormEventName, handler: Function): void {
    this._events.unsubscribe(eventName, handler)
  }
}


export default FormGroup
