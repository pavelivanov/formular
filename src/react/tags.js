import React from 'react'


/**
 *
 * @param props
 * @param props.field - formx field
 * @param props.value
 * @param props.onChange
 * @param props.onBlur
 * @returns {XML}
 * @constructor
 */
const Input = (props) => {
  const { field, ...rest } = props

  return (
    <input
      {...rest}
      onChange={async (event) => {
        await field.set(event.target.value)
        field.form.triggerChange()
      }}
      onBlur={async () => {
        await field.validate()
        field.form.triggerChange()
      }}
    />
  )
}


export {
  Input,
}
