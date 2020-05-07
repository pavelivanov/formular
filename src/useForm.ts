import { useMemo, useState, useEffect } from 'react'
import Form, { FormOpts } from './Form'


const useForm = <T extends {}>(opts: FormOpts<T>, deps?: any[]) => {
  const [ _, update ] = useState(0)
  const form = useMemo(() => new Form(opts), deps || [])

  useEffect(() => {
    const handleUpdate = () => {
      update((v) => ++v)
    }

    form.on('force update', handleUpdate)

    return () => {
      form.off('force update', handleUpdate)
    }
  }, [])

  return form
}


export default useForm
