const isEmpty = value => typeof value === 'undefined' || value === null || value === '' || /^\s+$/.test(value)


export const required = (value) => {
  if (isEmpty(value)) {
    return 'Required'
  }
}

export const telephone = (value) => {
  if (!isEmpty(value) && !/^\+1\s\d{3}\s\d{3}\s\d{2}\s\d{2}$/.test(value)) {
    return 'Must be a valid phone number'
  }
}

// only letters not available
// only numbers not available
// available symbols:  \s  A-Z  a-z  0-9  #  /  -
export const streetAddress = (value) => {
  if (
    !isEmpty(value)
    && (
      /^[A-Za-z]+$/.test(value)
      || /^\d+$/.test(value)
      || !/^[\sA-Za-z0-9#/-]+$/.test(value)
    )
  ) {
    return 'Must be a valid street address'
  }
}

export const successAsyncValidation = async (value) => {
  const isValid = await new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, 1000)
  })

  return undefined
}

export const failAsyncValidation = async (value) => {
  const isValid = await new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, 1000)
  })

  return 'Async validation failed'
}
