import equal from 'fast-deep-equal'
import { asyncSome, debounce, CancelablePromise } from './util'
import Events from './Events'
import Form from './Form'


export const eventNames = {
  stateChange: 'state change',
  set: 'set',
  unset: 'unset',
  change: 'change',
  focus: 'focus',
  blur: 'blur',
  startValidate: 'start validate',
  validate: 'validate',
} as const

export type FieldEventName = typeof eventNames[keyof typeof eventNames]

export type Validator = (value: any, fields: { [key: string]: Field<any> }) => void

export type FieldOpts<Value> = {
  name?: string
  node?: HTMLElement
  value?: Value
  validate?: Validator[]
  readOnly?: boolean
  validationDelay?: number
}

export type State<Value> = {
  value: Value
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

  private _events: Events<FieldEventName>
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

    this._events              = new Events<FieldEventName>()
    this._initialValue        = this.state.value
    this._cancelablePromise   = null

    // TODO how to detect this?
    // this.hasAsyncValidators = this.validators.some((validator) => (
    //   validator.constructor.name === 'AsyncFunction'
    // ))
  }

  setState(values: Partial<State<Value>>): void {
    const newState = { ...this.state, ...values }
    const isEqual = equal(this.state, newState)

    if (!isEqual) {
      this.state = newState
      this._events.dispatch(eventNames.stateChange, this.state)
    }
  }

  setRef(node: HTMLElement): void {
    this.node = node

    if (this.node) {
      this.node.addEventListener(eventNames.focus, this.handleFocus)
      this.node.addEventListener(eventNames.blur, this.handleBlur)
    }
  }

  unsetRef(): void {
    if (this.node) {
      this.node.removeEventListener(eventNames.focus, this.handleFocus)
      this.node.removeEventListener(eventNames.blur, this.handleBlur)
    }

    this.node = undefined
  }

  private handleFocus = () => {
    this._events.dispatch(eventNames.focus)
  }

  private handleBlur = () => {
    this._events.dispatch(eventNames.blur)
  }

  set(value: any): void {
    const modifiedValue = Field.modifyValue(value)

    if (modifiedValue !== this.state.value && !this.readOnly) {
      this.setState({
        value: modifiedValue,
        isChanged: true,
      })

      this._events.dispatch(eventNames.set, this.state.value)
      this._events.dispatch(eventNames.change, this.state.value) // @deprecated
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

    this._events.dispatch(eventNames.unset)
  }

  setError(error: any): void {
    this.setState({
      error,
      isChanged: true,
      isValid: false,
      isValidating: false,
      isValidated: true,
    })

    this._events.dispatch(eventNames.set, this.state.value)
    this._events.dispatch(eventNames.change, this.state.value) // @deprecated
  }

  validate = (): CancelablePromise => {
    if (!this.validators || !this.validators.length) {
      // existing error state should be cleared bcs it could be set from server validation via field.setError(err)
      this.setState({
        error: null,
        isValid: true,
        isValidating: false,
        isValidated: true,
      })

      return CancelablePromise.resolve()
    }

    let error: any

    this._events.dispatch(eventNames.startValidate)

    const setError = (error: string) => {
      this.setState({
        error,
        isValid: !error,
        isValidating: false,
        isValidated: true,
      })

      this._events.dispatch(eventNames.validate, this.state.error)
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

  on(eventName: FieldEventName, handler: Function): void {
    this._events.subscribe(eventName, handler)
  }

  off(eventName: FieldEventName, handler: Function): void {
    this._events.unsubscribe(eventName, handler)
  }
}


export default Field
