import { useMemo } from 'react'
import Field, { FieldOpts } from './Field'



const useField = <T extends {}>(opts: FieldOpts<T>, deps?: any[]) =>
  useMemo(() => new Field(opts), deps || [])


export default useField
