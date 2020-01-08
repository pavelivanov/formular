const debounce = (func: Function, wait: number, immediate?: boolean): Function => {
  let timeout

  return function () {
    const context = this

    const later = function () {
      timeout = null
      if (!immediate) {
        func.apply(context, arguments) // eslint-disable-line
      }
    }

    const callNow = immediate && !timeout

    clearTimeout(timeout)

    timeout = setTimeout(later, wait)

    if (callNow) {
      func.apply(context, arguments) // eslint-disable-line
    }
  }
}


export default debounce
