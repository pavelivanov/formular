import Events from './Events'
import Field, { FieldOpts, Validator } from './Field'


type Obj = {
  [key: string]: any
}

export type FormOpts<T extends Object> = {
  name?: string
  fields: {
    [K in keyof T]: FieldOpts<T[K]> | Validator[]
  }
  initialValues?: {
    [K in keyof T]: T[K]
  }
}

type FormFields<T extends {}> = {
  [K in keyof T]: Field<T[K]>
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

class Form<FieldValues extends Object> {

  private _events: Events
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

    this._events = new Events()

    this._setupFields()
  }

  private _setupFields() {
    const fieldNames = Object.keys(this.opts.fields) as Array<keyof FieldValues>

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

      field.on('change', () => {
        this._events.dispatch('change', field)
      })

      field.on('blur', () => {
        this._events.dispatch('blur', field)
      })
    })
  }

  setState(values: Partial<State>): void {
    this.state = { ...this.state, ...values }
    this._events.dispatch('state change', this.state)
  }

  setValues(values: Obj): void {
    // TODO should we mark form as changed and validate it?
    Object.keys(values).forEach((fieldName) => {
      const field = (this.fields as any)[fieldName]

      if (field) {
        field.set(values[fieldName])
      }
    })
  }

  getValues(): Obj {
    const values: Obj = {}

    Object.keys(this.fields).forEach((fieldName) => {
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

  getErrors(): Obj {
    const errors: Obj = {}

    Object.keys(this.fields).forEach((fieldName) => {
      errors[fieldName] = (this.fields as any)[fieldName].state.error
    })

    return errors
  }

  async validate(): Promise<boolean> {
    const promises  = Object.keys(this.fields).map((fieldName) => (this.fields as any)[fieldName].validate())
    const errors    = await Promise.all(promises)
    const isValid   = errors.every((error) => !error)

    this.setState({ isValid })

    return isValid
  }

  async submit(): Promise<object> {
    // validation takes values on start but user may change form values after this moment and before the validation end
    // so if getValues is called after validate() - values may be different in validation and result of sumbit
    // so we should get form values before async validation
    // TODO lock fields on validations start
    const values = this.getValues()

    // TODO don't validate if all fields are changed and valid
    await this.validate()

    if (!this.state.isValid) {
      return Promise.reject(this.getErrors())
    }

    return values
  }

  on(eventName: string, handler: Function): void {
    this._events.subscribe(eventName, handler)
  }

  off(eventName: string, handler: Function): void {
    this._events.unsubscribe(eventName, handler)
  }
}


export default Form
