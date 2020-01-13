import Events from './Events'
import Field from './Field'


export type FormOpts = {
  name?: string
  fields: object
  initialValues?: object
}

type State = {
  isValid: boolean
  isChanged: boolean
  isValidating: boolean
  isSubmitting: boolean
  isSubmitted: boolean
}

const defaultOptions = {
  initialValues: {},
}

class Form {

  private _events: Events
  name: string
  opts: FormOpts
  fields: object
  state: State

  constructor(opts: FormOpts) {
    this.name   = opts.name
    this.opts   = { ...defaultOptions, ...opts }
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
    Object.keys(this.opts.fields).forEach((fieldName) => {
      const initialValue  = this.opts.initialValues && this.opts.initialValues[fieldName]
      let fieldOpts       = this.opts.fields[fieldName]

      fieldOpts = Array.isArray(fieldOpts) ? { validate: fieldOpts } : fieldOpts

      if (typeof initialValue !== 'undefined') {
        fieldOpts.value = initialValue
      }

      const field = new Field(fieldName, fieldOpts, this)

      this.fields[fieldName] = field

      field.on('change', () => {
        this._events.dispatch('change', field)
      })

      field.on('blur', () => {
        this._events.dispatch('blur', field)
      })
    })
  }

  setState(values: Partial<State>) {
    this.state = { ...this.state, ...values }
    this._events.dispatch('state change', this.state)
  }

  setValues(values: object) {
    // TODO should we mark form as changed and validate it?
    Object.keys(values).forEach((fieldName) => {
      const field: Field = this.fields[fieldName]

      if (field) {
        field.set(values[fieldName])
      }
    })
  }

  getValues(): object {
    const values = {}

    Object.keys(this.fields).forEach((fieldName) => {
      values[fieldName] = this.fields[fieldName].state.value
    })

    return values
  }

  unsetValues() {
    this.setState({
      isChanged: false,
      isValid: true,
    })

    Object.keys(this.fields).forEach((fieldName) => {
      this.fields[fieldName].unset()
    })
  }

  getErrors(): object {
    const errors = {}

    Object.keys(this.fields).forEach((fieldName) => {
      errors[fieldName] = this.fields[fieldName].state.error
    })

    return errors
  }

  async validate(): Promise<boolean> {
    const promises  = Object.keys(this.fields).map((fieldName) => this.fields[fieldName].validate())
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

  on(eventName: string, handler: Function) {
    this._events.subscribe(eventName, handler)
  }

  off(eventName: string, handler: Function) {
    this._events.unsubscribe(eventName, handler)
  }
}


export default Form
