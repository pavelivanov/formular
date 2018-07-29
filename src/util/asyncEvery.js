const asyncEvery = async (arr, calle) => {
  if (arr.length) {
    const [ item, ...restItems ] = arr
    const isOk = await calle(item)

    if (isOk) {
      return asyncEvery(restItems, calle)
    }

    return false
  }

  return true
}


export default asyncEvery
