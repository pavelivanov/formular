import React, { useCallback } from 'react'
import Field from '../Field'
import useFieldState from '../useFieldState'


type InputProps = {
  field: Field
}

const Input: React.FunctionComponent<InputProps> = ({ field, onChange, ...rest }) => {
  const { value } = useFieldState(field)

  const handleChange = useCallback((event) => {
    field.set(event.target.value)
  }, [])

  return (
    <input
      type="text"
      {...rest}
      value={value}
      onchange={handleChange}
    />
  )
}


export default Input
