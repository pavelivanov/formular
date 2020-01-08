import { useContext, useEffect } from 'react'

import Field from './Field'
import FormContext from './FormContext'
import DumbContext from './DumbContext'
import useForceUpdate from './useForceUpdate'


const useFieldState = (fieldInstanceOrName: Field | string) => {
  const isNamePassed  = typeof fieldInstanceOrName === 'string'
  const form          = useContext(isNamePassed ? DumbContext : FormContext)
  const field         = isNamePassed ? form.fields[fieldInstanceOrName] : fieldInstanceOrName
  const forceUpdate   = useForceUpdate()

  useEffect(() => {
    field.on('change', forceUpdate)

    return () => {
      field.off('change', forceUpdate)
    }
  }, [])

  return field.state
}


export default useFieldState
