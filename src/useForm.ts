import { useMemo, useState, useEffect } from 'react'
import Form, { FormOpts } from './Form'


const useForm = <T extends {}>(opts: FormOpts<T>, deps?: any[]) => {
  const [ v, update ] = useState(0)
  const form = useMemo(() => new Form(opts), deps || [ v ])

  useEffect(() => {
    const handleUpdate = () => {
      update((v) => ++v)
    }

    form.on('update', handleUpdate)

    return () => {
      form.off('update', handleUpdate)
    }
  }, [])

  return form
}


export default useForm
