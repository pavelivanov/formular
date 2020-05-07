import { debounce } from './util/index'
import Events from './Events'
import Form, { eventNames as formEventNames, FormEventName, FormErrors } from './Form'


const eventNames = {
  replace: 'replace',
  setValues: 'set values',
  unsetValues: 'unset values',
  attachForms: 'attach forms',
  detachForms: 'detach forms',
  forceUpdate: 'force update',
  submit: 'submit',
} as const

export type FormGroupEventName = typeof eventNames[keyof typeof eventNames]

type FormsValues<FormsFieldValues> = {
  [K in keyof FormsFieldValues]: any
}

type FormsErrors<FormsFieldValues> = {
  [K in keyof FormsFieldValues]: FormErrors<FormsFieldValues[K]> | null
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
    this.forceUpdate()
  }

  detachForms(formNames: Array<keyof FormsFieldValues>): void {
    formNames.forEach((fieldName) => {
      delete this.forms[fieldName]
    })

    this._events.dispatch(eventNames.detachForms)
    this.forceUpdate()
  }

  replace(newForms: FormInstances<FormsFieldValues>) {
    this._unsubscribe()

    this.forms = newForms

    this._subscribe()
    this._events.dispatch(eventNames.replace)
    this.forceUpdate()
  }

  forceUpdate(): void {
    this._events.dispatch(eventNames.forceUpdate)
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

    this._events.dispatch(eventNames.setValues)
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

    this._events.dispatch(eventNames.unsetValues)
  }

  // TODO looks like getValues() if we need rewrite it? Write getKeyValues(key)
  getErrors(): FormsErrors<FormsFieldValues> | null {
    const formNames = Object.keys(this.forms) as Array<keyof FormsFieldValues>
    const errors = {} as FormsErrors<FormsFieldValues>

    formNames.forEach((formName) => {
      const form = this.forms[formName]
      const formErrors = form.getErrors()

      if (formErrors) {
        errors[formName] = formErrors
      }
    })

    return Object.keys(errors).length ? errors : null
  }

  async submit(): Promise<FormsFieldValues> {
    // validation takes values on start but user may change form values after this moment and before the validation end
    // so if getValues is called after validate() - values may be different in validation and result of sumbit
    // so we should get form values before async validation
    // TODO lock fields on validations start
    const values = this.getValues()
    const isValid = await this.validate()

    let result
    let errors

    if (isValid) {
      result = Promise.resolve(values)
    }
    else {
      errors = this.getErrors()
      result = Promise.reject(errors)
    }

    this._events.dispatch(eventNames.submit, errors, values)

    return result
  }

  on(eventName: FormGroupEventName | FormEventName, handler: Function): void {
    this._events.subscribe(eventName, handler)
  }

  off(eventName: FormGroupEventName | FormEventName, handler: Function): void {
    this._events.unsubscribe(eventName, handler)
  }
}


export default FormGroup
