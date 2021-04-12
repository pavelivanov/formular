import React from 'react'
import Field, { State } from './Field'
import useFieldState from './useFieldState'


type FieldStateProps = {
  children: (state: State) => React.ReactElement
  field: Field
}

const FieldState: React.FunctionComponent<FieldStateProps> = ({ children, field }) => {
  const fieldState = useFieldState(field)

  return children(fieldState)
}


export default FieldState
