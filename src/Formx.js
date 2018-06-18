import Fields from './Fields'
import events from './events'


class Formx {

  /**
   *
   * @param options
   * @param options.fields {object}
   * @param options.initialValues {function}
   */
  constructor(options) {
    this.fields = this._getFields(options)
    this.isValid = true
  }

  _getFields(options) {
    return new Fields(options.fields)
  }

  updateOptions(options) {
    this.fields = this._getFields(options)
  }

  updateFieldValues(values) {

  }

  validate() {
    this.isValid = this.fields.validate()

    return this.isValid
  }

  on(eventName, handler) {
    events.subscribe(eventName, handler)
  }
}


export default Formx
