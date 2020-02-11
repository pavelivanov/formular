import { useMemo } from 'react'
import Field, { FieldOpts } from './Field'



const useField = (opts: FieldOpts, deps?: any[]) =>
  useMemo(() => new Field(opts), deps || [])


export default useField
