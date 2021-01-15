import { useMemo } from 'react'
import Field, { FieldOpts } from './Field'



const useField = <T extends any>(opts?: FieldOpts<T>, deps?: any[]) =>
  useMemo(() => new Field(opts), deps || [])


export default useField
