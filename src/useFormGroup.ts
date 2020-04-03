import { useMemo, useState, useEffect } from 'react'
import FormGroup from './FormGroup'
import Form from './Form'


type Forms<T> = {
  [K in keyof T]: Form<T[K]>
}

const useFormGroup = <T extends {}>(forms: Forms<T>, deps?: any[]) => {
  const [ v, update ] = useState(0)
  const form = useMemo(() => new FormGroup(forms), deps || [ v ])

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


export default useFormGroup
