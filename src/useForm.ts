import { useMemo } from 'react'

import Form, { FormOpts } from './Form'


const useForm = (opts: FormOpts) => {
  const form = useMemo(() => new Form(opts), [])

  return form
}


export default useForm
