import { useMemo } from 'react'
import Form, { FormOpts } from './Form'


const useForm = <T extends {}>(opts: FormOpts<T>, deps?: any[]) =>
  useMemo(() => new Form(opts), deps || [])


export default useForm
