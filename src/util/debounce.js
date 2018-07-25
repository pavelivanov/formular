const debounce = (func, wait, immediate) => {
  let timeout

  return function () {
    const context = this

    const later = function () {
      timeout = null
      if (!immediate) {
        func.apply(context, arguments)
      }
    }

    const callNow = immediate && !timeout

    clearTimeout(timeout)

    timeout = setTimeout(later, wait)

    if (callNow) {
      func.apply(context, arguments)
    }
  }
}


export default debounce
