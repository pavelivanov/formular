import { useMemo, useState, useEffect } from 'react'
import Form, { FormOpts } from './Form'


const useForm = <T extends any>(opts: FormOpts<T>, deps?: any[]) => {
  const [ v, update ] = useState(0)
  const form = useMemo(() => new Form(opts), deps || [ v ])

  useEffect(() => {
    const handleFormUpdates = () => {
      update((v) => ++v)
    }

    form.on('attach fields', handleFormUpdates)
    form.on('detach fields', handleFormUpdates)

    return () => {
      form.off('attach fields', handleFormUpdates)
      form.off('detach fields', handleFormUpdates)
    }
  }, [])

  return form
}


export default useForm
