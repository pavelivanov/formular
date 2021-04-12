import React from 'react'
import equal from 'fast-deep-equal'
import { asyncSome, debounce, CancelablePromise } from './util'
import Events from './Events'
import Form from './Form'


export const eventNames = {
  stateChange: 'state change',
  change: 'change',
  unset: 'unset',
  focus: 'focus',
  blur: 'blur',
  startValidate: 'start validate',
  validate: 'validate',
} as const

export type FieldEventName = typeof eventNames[keyof typeof eventNames]

export type Validator = (value: any, fields: { [key: string]: Field<any> }) => void

export type FieldOpts<Value> = {
  name?: string
  node?: HTMLInputElement
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
  opts?: FieldOpts<Value>
  node?: HTMLInputElement
  validators: Validator[]
  readOnly: boolean
  debounceValidate: Function
  state: State<Value>
  props: {
    ref: (node: HTMLInputElement) => void
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    onFocus: (event: FocusEvent | React.FocusEvent<HTMLInputElement>) => void
    onBlur: (event: FocusEvent | React.FocusEvent<HTMLInputElement>) => void
  }

  private _events: Events<FieldEventName>
  private _initialValue: any
  private _cancelablePromise: CancelablePromise | null

  static modifyValue(value: any): any {
    return typeof value === 'string' ? value : ''
  }

  constructor(opts?: FieldOpts<Value>, form?: Form<any>) {
    this.form                 = form
    this.opts                 = opts || {}
    this.name                 = this.opts.name
    this.node                 = this.opts.node
    this.readOnly             = this.opts.readOnly || false
    this.validators           = this.opts.validate || []
    this.debounceValidate     = this.opts.validationDelay ? debounce(this.validate, this.opts.validationDelay) : this.validate

    this.state = {
      value: Field.modifyValue(this.opts.value),
      error: null,
      isChanged: false,
      isValidating: false,
      isValidated: false,
      isValid: true,
    }

    this.props = {
      ref: (node) => this.node = node,
      onChange: (event) => this.set(event.currentTarget.value),
      onFocus: this.handleFocus,
      onBlur: this.handleBlur,
    }

    this._events              = new Events<FieldEventName>()
    this._initialValue        = this.state.value
    this._cancelablePromise   = null

    // TODO how to detect this?
    // this.hasAsyncValidators = this.validators.some((validator) => (
    //   validator.constructor.name === 'AsyncFunction'
    // ))
  }

  // Common methods

  setState(values: Partial<State<Value>>): void {
    const newState = { ...this.state, ...values }
    const isEqual = equal(this.state, newState)

    if (!isEqual) {
      this.state = newState
      this._events.dispatch(eventNames.stateChange, this.state)
    }
  }

  setRef(node: HTMLInputElement): void {
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

  private handleFocus = (event: FocusEvent | React.FocusEvent<HTMLInputElement>) => {
    this._events.dispatch(eventNames.focus, event)
  }

  private handleBlur = (event: FocusEvent | React.FocusEvent<HTMLInputElement>) => {
    this._events.dispatch(eventNames.blur, event)
  }

  set(value: any): void {
    const modifiedValue = Field.modifyValue(value)

    if (modifiedValue !== this.state.value && !this.readOnly) {
      this.setState({
        value: modifiedValue,
        isChanged: true,
      })

      this._events.dispatch(eventNames.change, this.state.value)
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

    this._events.dispatch(eventNames.change, this.state.value)
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
