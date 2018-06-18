const getFieldsValues = (options) => {
  const fields = {}

  Object.keys(options).forEach((fieldName) => {
    const opts = options[fieldName]

    if (opts.fields) {
      fields[fieldName] = getFieldsValues(opts)
    }
    else {
      fields[fieldName] = this.getField()
    }
  })

  return fields
}


export default getFieldsValues
