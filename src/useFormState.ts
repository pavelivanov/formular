import { useEffect } from 'react'

import Form from './Form'
import useForceUpdate from './useForceUpdate'


const useFormState = (form: Form) => {
  const forceUpdate   = useForceUpdate()

  useEffect(() => {
    form.on('change', forceUpdate)
    form.on('state change', forceUpdate)

    return () => {
      form.off('change', forceUpdate)
      form.off('state change', forceUpdate)
    }
  }, [ form ])

  const state   = form.state
  const values  = form.getValues()
  const errors  = form.getErrors()

  return { ...state, values, errors }
}


export default useFormState
