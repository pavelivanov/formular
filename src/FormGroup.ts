import { debounce } from './util/index'
import Events from './Events'
import Form, { eventNames as formEventNames, FormEventName, FormErrors } from './Form'


const eventNames = {
  replace: 'replace',
  setValues: 'set values',
  unsetValues: 'unset values',
  attachForms: 'attach forms',
  detachForms: 'detach forms',
} as const

export type FormGroupEventName = typeof eventNames[keyof typeof eventNames]

type FormsValues<FormsFieldValues> = {
  [K in keyof FormsFieldValues]: any
}

type FormsErrors<FormsFieldValues> = {
  [K in keyof FormsFieldValues]: FormErrors<FormsFieldValues[K]>
}

type FormInstances<FormsFieldValues> = {
  [K in keyof FormsFieldValues]: Form<FormsFieldValues[K]>
}

class FormGroup<FormsFieldValues extends {}> {

  private _events: Events<FormGroupEventName | FormEventName>
  forms: FormInstances<FormsFieldValues>

  constructor(forms?: FormInstances<FormsFieldValues>) {
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

  attachForms(forms: Partial<FormInstances<FormsFieldValues>>): void {
    const formNames = Object.keys(forms) as Array<keyof FormsFieldValues>

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

  detachForms(formNames: Array<keyof FormsFieldValues>): void {
    formNames.forEach((fieldName) => {
      delete this.forms[fieldName]
    })

    this._events.dispatch(eventNames.detachForms)
  }

  replace(newForms: FormInstances<FormsFieldValues>) {
    this._unsubscribe()

    this.forms = newForms

    this._subscribe()
    this._events.dispatch(eventNames.replace)
  }

  async validate(): Promise<boolean> {
    const forms     = Object.values(this.forms) as Array<FormInstances<FormsFieldValues>[keyof FormInstances<FormsFieldValues>]>
    const statuses  = await Promise.all(forms.map((form) => form.validate()))
    const isValid   = statuses.every((isValid) => isValid)

    return isValid
  }

  setValues(values: FormsValues<FormsFieldValues>): void {
    const formNames = Object.keys(this.forms) as Array<keyof FormsFieldValues>

    formNames.forEach((formName) => {
      const form        = this.forms[formName]
      const formValues  = values[formName]

      if (formValues) {
        form.setValues(formValues)
      }
    })

    this._events.dispatch('set values')
  }

  getValues(): FormsValues<FormsFieldValues> {
    const formNames = Object.keys(this.forms) as Array<keyof FormsFieldValues>
    const values = {} as FormsValues<FormsFieldValues>

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      values[formName] = form.getValues()
    })

    return values
  }

  unsetValues(): void {
    const formNames = Object.keys(this.forms) as Array<keyof FormsFieldValues>

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      form.unsetValues()
    })

    this._events.dispatch('unset values')
  }

  // TODO looks like getValues() if we need rewrite it? Write getKeyValues(key)
  getErrors(): FormsErrors<FormsFieldValues> {
    const formNames = Object.keys(this.forms) as Array<keyof FormsFieldValues>
    const errors = {} as FormsErrors<FormsFieldValues>

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      errors[formName] = form.getErrors()
    })

    return errors
  }

  async submit(): Promise<FormsFieldValues> {
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
