import Events from './Events'
import Field, { eventNames as fieldEventNames, FieldOpts, Validator } from './Field'


export const eventNames = {
  stateChange: 'state change',
  attachFields: 'attach fields',
  detachFields: 'detach fields',
  forceUpdate: 'force update',
  change: 'change',
  focus: 'focus',
  blur: 'blur',
  submit: 'submit',
} as const

export type FormEventName = typeof eventNames[keyof typeof eventNames]

type FormFieldOpts<T> = {
  [K in keyof T]: FieldOpts<T[K]> | Validator[]
}

export type FormOpts<T extends {}> = {
  name?: string
  fields: FormFieldOpts<T>
  initialValues?: Partial<{
    [K in keyof T]: T[K]
  }>
}

type FormFields<T extends {}> = {
  [K in keyof T]: Field<T[K]>
}

export type FormErrors<T extends {}> = {
  [K in keyof T]: any
}

type State = {
  isValid: boolean
  isChanged: boolean
  isValidating: boolean
  isSubmitting: boolean
  isSubmitted: boolean
}

const defaultOptions: any = {
  initialValues: {},
}

class Form<FieldValues extends {}> {

  private _events: Events<FormEventName>
  name?: string
  opts: FormOpts<FieldValues>
  fields: FormFields<FieldValues>
  state: State

  constructor(opts: FormOpts<FieldValues>) {
    this.name   = opts.name
    this.opts   = { ...defaultOptions, ...opts }
    // @ts-ignore
    this.fields = {}

    this.state = {
      isValid: true,
      isChanged: false,  // TODO connect to Field
      isValidating: false,
      isSubmitting: false,
      isSubmitted: false,
    }

    this._events = new Events<FormEventName>()

    this._attachFields(this.opts.fields)
  }

  private _attachFields(fieldOpts: FormFieldOpts<FieldValues> | Partial<FormFieldOpts<FieldValues>>) {
    const fieldNames = Object.keys(fieldOpts) as Array<keyof FieldValues>

    fieldNames.forEach((fieldName) => {
      const initialValue = this.opts.initialValues && this.opts.initialValues[fieldName]
      let fieldOpts: FieldOpts<FieldValues[typeof fieldName]> | Validator[] = this.opts.fields[fieldName]

      fieldOpts = Array.isArray(fieldOpts) ? { validate: fieldOpts } : fieldOpts
      fieldOpts.name = fieldName as string

      if (typeof initialValue !== 'undefined') {
        fieldOpts.value = initialValue
      }

      const field = new Field<FieldValues[typeof fieldName]>(fieldOpts, this)

      this.fields[fieldName] = field

      const eventKeys = [ 'change', 'focus', 'blur' ] as const

      eventKeys.forEach((key) => {
        field.on(fieldEventNames[key], () => {
          this._events.dispatch(eventNames[key], field)
        })
      })
    })
  }

  attachFields(fieldOpts: Partial<FormFieldOpts<FieldValues>>): void {
    this._attachFields(fieldOpts)
    this._events.dispatch(eventNames.attachFields)
    this.forceUpdate()
  }

  detachFields(fieldNames: Array<keyof FieldValues>): void {
    fieldNames.forEach((fieldName) => {
      delete this.fields[fieldName]
    })

    this._events.dispatch(eventNames.detachFields)
    this.forceUpdate()
  }

  forceUpdate(): void {
    this._events.dispatch(eventNames.forceUpdate)
  }

  setState(values: Partial<State>): void {
    this.state = { ...this.state, ...values }
    this._events.dispatch(eventNames.stateChange, this.state)
  }

  setValues(values: FieldValues): void {
    const fieldNames = Object.keys(values) as Array<keyof FieldValues>

    // TODO should we mark form as changed and validate it?
    fieldNames.forEach((fieldName) => {
      const field = (this.fields as any)[fieldName]

      if (field) {
        field.set(values[fieldName])
      }
    })
  }

  getValues(): FieldValues {
    const fieldNames = Object.keys(this.fields) as Array<keyof FieldValues>
    const values = {} as FieldValues

    fieldNames.forEach((fieldName) => {
      values[fieldName] = (this.fields as any)[fieldName].state.value
    })

    return values
  }

  unsetValues(): void {
    this.setState({
      isChanged: false,
      isValid: true,
    })

    Object.keys(this.fields).forEach((fieldName) => {
      (this.fields as any)[fieldName].unset()
    })
  }

  setErrors(errors: FormErrors<FieldValues>): void {
    const fieldNames = Object.keys(errors) as Array<keyof FieldValues>

    fieldNames.forEach((fieldName) => {
      const field = (this.fields as any)[fieldName]

      if (field) {
        field.setError(errors[fieldName])
      }
    })
  }

  getErrors(): FormErrors<FieldValues> | null {
    const fieldNames = Object.keys(this.fields) as Array<keyof FieldValues>
    const errors = {} as FieldValues

    fieldNames.forEach((fieldName) => {
      const error = (this.fields as any)[fieldName].state.error

      if (error) {
        errors[fieldName] = error
      }
    })

    return Object.keys(errors).length ? errors : null
  }

  async validate(): Promise<boolean> {
    const promises  = Object.keys(this.fields).map((fieldName) => (this.fields as any)[fieldName].validate())
    const errors    = await Promise.all(promises)
    const isValid   = errors.every((error) => !error)

    this.setState({ isValid })

    return isValid
  }

  async submit(): Promise<FieldValues> {
    // validation takes values on start but user may change form values after this moment and before the validation end
    // so if getValues is called after validate() - values may be different in validation and result of sumbit
    // so we should get form values before async validation
    // TODO lock fields on validations start
    const values = this.getValues()
    // TODO don't validate if all fields are changed and valid
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

  on(eventName: FormEventName, handler: Function): void {
    this._events.subscribe(eventName, handler)
  }

  off(eventName: FormEventName, handler: Function): void {
    this._events.unsubscribe(eventName, handler)
  }
}


export default Form
