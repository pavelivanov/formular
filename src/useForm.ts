import { useMemo } from 'react'
import Form, { FormOpts } from './Form'



const useForm = (opts: FormOpts, deps?: any[]) =>
  useMemo(() => new Form(opts), deps || [])


export default useForm
