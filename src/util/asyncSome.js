const asyncSome = async (arr, calle) => {
  if (arr.length) {
    const [ item, ...restItems ] = arr
    const isMatch = await calle(item)

    if (isMatch) {
      return true
    }

    return asyncSome(restItems, calle)
  }

  return false
}


export default asyncSome
