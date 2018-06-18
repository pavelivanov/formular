import events from './events'


class Field {

  constructor(name, options) {
    this.name         = name
    this.value        = options.value === undefined || options.value === null ? '' : options.value
    this.error        = null
    this.isChanged    = false
    this.isValid      = true

    this._validators = options.validate || []
  }

  validate() {
    let error

    if (this._validators && this._validators.length) {
      // console.log(`field "${this.name}" validation:`)
      // console.log('value:', this.value)
    }

    this._validators.some((validator) => {
      error = validator(this.value)

      // console.log('')
      // console.log('validator:', validator.name)
      // console.log('error:', error)
    })

    this.isValid = !error
    this.error = error

    return this.isValid
  }

  set(value) {
    this.value = value

    events.dispatchEvent('field value change')
  }
}


export default Field
