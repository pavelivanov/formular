import Fields from './Fields'


class FieldsGroup {

  constructor(name, options) {
    this.name       = name
    this.fields     = this._getFields(options)
    this.validators = options.validate || []
    this.isChanged  = false
    this.isValid    = true
    this.error      = null
  }

  _getFields(options) {
    return new Fields(options.fields)
  }

  validate() {
    this.isValid = Object.keys(this.fields).every((fieldName) => (
      this.fields[fieldName].validate()
    ))

    return this.isValid
  }
}


export default FieldsGroup
