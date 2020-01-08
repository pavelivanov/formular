const asyncSome = async (arr: Array<any>, calle: Function) => {
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
