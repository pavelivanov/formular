import { useMemo, useState, useEffect } from 'react'
import FormGroup from './FormGroup'
import Form from './Form'


type Forms<T> = {
  [K in keyof T]: Form<T[K]>
}

const useFormGroup = <T extends {}>(forms: Forms<T>, deps?: any[]) => {
  const [ _, update ] = useState(0)
  const formGroup = useMemo(() => new FormGroup(forms), deps || [])

  useEffect(() => {
    const handleUpdate = () => {
      update((v) => ++v)
    }

    formGroup.on('force update', handleUpdate)

    return () => {
      formGroup.off('force update', handleUpdate)
    }
  }, [])

  return formGroup
}


export default useFormGroup
