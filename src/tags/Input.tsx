import React, { useCallback } from 'react'
import Field from '../Field'
import useFieldState from '../useFieldState'


type InputProps = React.InputHTMLAttributes<any> & {
  field: Field<string>
}

const Input: React.FunctionComponent<InputProps> = ({ field, onChange, ...rest }) => {
  const { value } = useFieldState(field)

  const handleChange = useCallback((event) => {
    field.set(event.target.value)

    if (typeof onChange === 'function') {
      onChange(event)
    }
  }, [ field ])

  return (
    <input
      type="text"
      {...rest}
      value={value}
      onChange={handleChange}
    />
  )
}


export default Input
