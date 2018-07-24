const asyncSome = async (arr, calle) => {
  if (arr.length) {
    const item = arr.shift()
    const isMatch = await calle(item)

    if (isMatch) {
      return true
    }

    return asyncSome(arr, calle)
  }

  return false
}


class Field {

  /**
   *
   * @param name
   * @param {Object|Array} options - can be object options or list of validators
   */
  constructor(name, options) {
    this.name         = name
    this.value        = options.value === undefined || options.value === null ? '' : options.value
    this.error        = null
    this.isChanged    = false
    this.isValid      = true

    this._validators = options.validate || options
  }

  async validate() {
    let error

    if (this._validators && this._validators.length) {
      await asyncSome(this._validators, async (validator) => {
        error = await validator(this.value)

        // console.log('')
        // console.log('validator:', validator.name)
        // console.log('error:', error)

        return error
      })
    }

    this.isValid = !error
    this.error = error

    return error
  }

  set(value) {
    this.value = value
  }
}


export default Field
