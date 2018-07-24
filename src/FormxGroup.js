class FormxGroup {

  /**
   *
   * @param {Object} forms
   */
  constructor(forms) {
    this.forms = forms
  }

  async validate() {
    const forms     = Object.values(this.forms)
    const statuses  = await Promise.all(forms.map((form) => form.validate()))
    const isValid   = statuses.every((isValid) => isValid)

    return isValid
  }

  getValues() {
    const formNames = Object.keys(this.forms)
    const values = {}

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      values[formName] = form.getValues()
    })

    return values
  }

  // TODO looks like getValues() if we need rewrite it? Write getKeyValues(key)
  getErrors() {
    const formNames = Object.keys(this.forms)
    const errors = {}

    formNames.forEach((formName) => {
      const form = this.forms[formName]

      errors[formName] = form.getErrors()
    })

    return errors
  }

  async submit() {
    const isValid = await this.validate()

    if (!isValid) {
      const errors = this.getErrors()

      return Promise.reject(errors)
    }

    const values = this.getValues()

    return values
  }
}

export default FormxGroup
