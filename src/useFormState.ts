import { useContext, useEffect } from 'react'

import Form from './Form'
import FormContext from './FormContext'
import DumbContext from './DumbContext'
import useForceUpdate from './useForceUpdate'


const useFormState = (form: Form) => {
  const context       = useContext(form ? DumbContext : FormContext)
  const forceUpdate   = useForceUpdate()
  const _form: Form   = form || context

  useEffect(() => {
    _form.on('change', forceUpdate)
    _form.on('state change', forceUpdate)

    return () => {
      _form.off('change', forceUpdate)
      _form.off('state change', forceUpdate)
    }
  }, [ _form ])

  const state   = _form.state
  const values  = _form.getValues()
  const errors  = _form.getErrors()

  return { ...state, values, errors }
}


export default useFormState
