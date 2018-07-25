import Field from './Field'


const asyncEvery = async (arr, calle) => {
  if (arr.length) {
    const [ item, ...restItems ] = arr
    const isOk = await calle(item)

    if (isOk) {
      return asyncEvery(restItems, calle)
    }

    return false
  }

  return true
}


class Fields {

  /**
   *
   * @param {Object} form
   * @param {Object} options
   * @param {Object} initialValues
   */
  constructor(form, options, initialValues = {}) {
    Object.keys(options).forEach((fieldName) => {
      const opts          = options[fieldName]
      const initialValue  = initialValues[fieldName]

      // TODO if we may move this into Field
      if (initialValue !== undefined) {
        opts.value = initialValue
      }

      this[fieldName] = new Field(form, fieldName, opts)
    })
  }

  /**
   *
   * @param {Object} values
   */
  setValues(values) {
    Object.keys(values).forEach((fieldName) => {
      const value = values[fieldName]
      const field = this[fieldName]

      if (field) {
        field.set(value)
      }
    })
  }

  async validate() {
    // TODO rewrite with generators
    const isValid = asyncEvery(Object.keys(this), async (fieldName) => {
      const error = await this[fieldName].validate()

      return !error
    })

    return isValid
  }

  destroy() {
    // off handlers for form reset
  }
}


export default Fields
