import Field from './Field'


class Fields {

  constructor(options) {
    Object.keys(options).forEach((fieldName) => {
      const opts = options[fieldName]

      this[fieldName] = new Field(fieldName, opts)
    })
  }

  validate() {
    return Object.keys(this).every((fieldName) => {
      const error = this[fieldName].validate()

      return !error
    })
  }
}


export default Fields
