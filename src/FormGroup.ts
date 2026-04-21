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

class FormGroup<FormsFieldValues> {

  private _events: Events<FormGroupEventName | FormEventName>
  private _formHandlers: Map<Form<any>, Partial<Record<FormEventName, Function>>>
  forms: FormInstances<FormsFieldValues>

  constructor(forms?: FormInstances<FormsFieldValues>) {
    this._events = new Events<FormGroupEventName | FormEventName>()
    this._formHandlers = new Map()
    // @ts-ignore
    this.forms = forms || {}

    this._subscribe()
  }

  private _subscribeForm(form: Form<any>) {
    if (this._formHandlers.has(form)) {
      return
    }

    const handlers: Partial<Record<FormEventName, Function>> = {}
    const eventNames = Object.keys(formEventNames) as FormEventName[]

    eventNames.forEach((eventName) => {
      const handler = debounce(() => {
        this._events.dispatch(eventName)
      }, 100)

      handlers[eventName] = handler
      form.on(eventName, handler)
    })

    this._formHandlers.set(form, handlers)
  }

  private _unsubscribeForm(form: Form<any>) {
    const handlers = this._formHandlers.get(form)

    if (!handlers) {
      return
    }

    const eventNames = Object.keys(handlers) as FormEventName[]

    eventNames.forEach((eventName) => {
      const handler = handlers[eventName]
      if (handler) {
        form.off(eventName, handler)
      }
    })

    this._formHandlers.delete(form)
  }

  private _subscribe() {
    const forms = Object.values(this.forms) as Array<Form<any>>
    forms.forEach((form) => this._subscribeForm(form))
  }

  private _unsubscribe() {
    Array.from(this._formHandlers.keys()).forEach((form) => this._unsubscribeForm(form))
  }

  attachForms(forms: Partial<FormInstances<FormsFieldValues>>): void {
    const formNames = Object.keys(forms) as Array<keyof FormsFieldValues>

    formNames.forEach((formName) => {
      if (formName in this.forms) {
        console.error(`Form with name "${String(formName)}" already exists in FormGroup`)
      }
      else {
        const form = forms[formName] as Form<any>
        this.forms[formName] = form as any
        this._subscribeForm(form)
      }
    })

    this._events.dispatch(eventNames.attachForms)
    this.forceUpdate()
  }

  detachForms(formNames: Array<keyof FormsFieldValues>): void {
    formNames.forEach((formName) => {
      const form = this.forms[formName] as Form<any> | undefined
      if (form) {
        this._unsubscribeForm(form)
      }
      delete this.forms[formName]
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

  setValues(values: FormsValues<Partial<FormsFieldValues>>): void {
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

  async submit(): Promise<{ values: FormsValues<FormsFieldValues>, errors: FormsErrors<FormsFieldValues> | null }> {
    const forms = Object.values(this.forms) as Array<Form<any>>

    forms.forEach((form) => form.setState({ isSubmitting: true }))

    try {
      const values = this.getValues()

      await this.validate()

      const errors = this.getErrors()

      this._events.dispatch(eventNames.submit, errors, values)

      return {
        values,
        errors,
      }
    }
    finally {
      forms.forEach((form) => form.setState({ isSubmitting: false, isSubmitted: true }))
    }
  }

  on(eventName: FormGroupEventName | FormEventName, handler: Function): void {
    this._events.subscribe(eventName, handler)
  }

  off(eventName: FormGroupEventName | FormEventName, handler: Function): void {
    this._events.unsubscribe(eventName, handler)
  }
}


export default FormGroup
