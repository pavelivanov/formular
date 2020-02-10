import React, { useCallback } from 'react'
import Field from '../Field'
import useFieldState from '../useFieldState'


type CheckboxProps = HTMLInputElement & {
  field: Field
}

const Checkbox: React.FunctionComponent<CheckboxProps> = ({ field, onChange, ...rest }) => {
  const { value } = useFieldState(field)

  const handleChange = useCallback((event) => {
    field.set(event.target.checked)

    if (typeof onChange === 'function') {
      onChange(event)
    }
  }, [])

  return (
    <input
      type="checkbox"
      {...rest}
      checked={value}
      onchange={handleChange}
    />
  )
}


export default Checkbox
