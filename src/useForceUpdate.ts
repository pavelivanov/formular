import { useState, useCallback } from 'react'


const useForceUpdate = () => {
  const [ _, setState ] = useState(0)

  return useCallback(() => setState((v) => v + 1), [])
}


export default useForceUpdate
