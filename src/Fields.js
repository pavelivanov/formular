import FieldsGroup from './FieldsGroup'
import Field from './Field'


class Fields {

  constructor(options) {
    Object.keys(options).forEach((fieldName) => {
      const opts = options[fieldName]

      this[fieldName] = opts.fields ? new FieldsGroup(fieldName, opts) : new Field(fieldName, opts)
    })
  }

  validate() {
    return Object.keys(this).every((fieldName) => (
      this[fieldName].validate()
    ))
  }
}


export default Fields
