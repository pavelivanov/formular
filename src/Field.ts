import { asyncSome, debounce, CancelablePromise } from './util/index'
import Events from './Events'
import Form from './Form'


export type Validator = (value: any, fields: { [key: string]: Field<any> }) => void

export type FieldOpts<Value> = {
  name?: string
  node?: HTMLElement
  value?: Value
  validate?: Validator[]
  readOnly?: boolean
  validationDelay?: number
}

type State<ValueType> = {
  value: ValueType
  error: any
  isChanged: boolean
  isValidating: boolean
  isValidated: boolean
  isValid: boolean
}

class Field<Value> {

  form?: Form<any>
  name?: string
  opts: FieldOpts<Value>
  node?: HTMLElement
  validators: Validator[]
  readOnly: boolean
  debounceValidate: Function
  state: State<Value>

  private _events: Events
  private _initialValue: any
  private _cancelablePromise: CancelablePromise | null

  static modifyValue(value: any): any {
    return value === undefined || value === null ? '' : value
  }

  constructor(opts: FieldOpts<Value> = {}, form?: Form<any>) {
    this.form                 = form
    this.opts                 = opts
    this.name                 = opts.name
    this.node                 = opts.node
    this.readOnly             = opts.readOnly || false
    this.validators           = opts.validate || []
    this.debounceValidate     = this.opts.validationDelay ? debounce(this.validate, this.opts.validationDelay) : this.validate

    this.state = {
      value: Field.modifyValue(opts.value),
      error: null,
      isChanged: false,
      isValidating: false,
      isValidated: false,
      isValid: true,
    }

    this._events              = new Events()
    this._initialValue        = this.state.value
    this._cancelablePromise   = null

    // TODO how to detect this?
    // this.hasAsyncValidators = this.validators.some((validator) => (
    //   validator.constructor.name === 'AsyncFunction'
    // ))
  }

  setState(values: Partial<State<Value>>): void {
    this.state = { ...this.state, ...values }
    this._events.dispatch('state change', this.state)
  }

  setRef(node: HTMLElement): void {
    this.node = node

    if (this.node) {
      this.node.addEventListener('blur', this.handleBlur)
    }
  }

  unsetRef(): void {
    if (this.node) {
      this.node.removeEventListener('blur', this.handleBlur)
    }

    this.node = undefined
  }

  private handleBlur = () => {
    this._events.dispatch('blur')
  }

  set(value: any): void {
    const modifiedValue = Field.modifyValue(value)

    if (modifiedValue !== this.state.value && !this.readOnly) {
      this.setState({
        value: modifiedValue,
        isChanged: true,
      })

      this._events.dispatch('set', this.state.value)
      this._events.dispatch('change', this.state.value) // @deprecated
    }
  }

  unset(): void {
    this.setState({
      value: this._initialValue,
      error: null,
      isChanged: false,
      isValidating: false,
      isValidated: false,
      isValid: true,
    })

    this._events.dispatch('unset')
  }

  validate = (): CancelablePromise => {
    if (!this.validators || !this.validators.length) {
      return CancelablePromise.resolve()
    }

    let error: any

    this._events.dispatch('start validate')

    const setError = (error: string) => {
      this.setState({
        error,
        isValid: !error,
        isValidating: false,
        isValidated: true,
      })

      this._events.dispatch('validate', this.state.error)
    }

    this.setState({
      isValidating: true,
    })

    if (this._cancelablePromise) {
      this._cancelablePromise.cancel()
    }

    this._cancelablePromise = new CancelablePromise(async (resolve: Function) => {
      await asyncSome(this.validators, async (validator: Function) => {
        error = await validator(this.state.value, this.form && this.form.fields) // error here is String error message
        return Boolean(error)
      })
      resolve()
    })

    return this._cancelablePromise.then(() => {
      setError(error)

      return error
    })
  }

  on(eventName: string, handler: Function): void {
    this._events.subscribe(eventName, handler)
  }

  off(eventName: string, handler: Function): void {
    this._events.unsubscribe(eventName, handler)
  }
}


export default Field
