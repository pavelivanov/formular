const isEmpty = (value: any): boolean =>
  typeof value === 'undefined' || value === null || value === '' || /^\s+$/.test(value)


export const required = (value: any): string | undefined => {
  if (isEmpty(value)) {
    return 'Required'
  }
  return undefined
}

export const telephone = (value: any): string | undefined => {
  if (!isEmpty(value) && !/^\+1\s\d{3}\s\d{3}\s\d{2}\s\d{2}$/.test(value)) {
    return 'Must be a valid phone number'
  }
  return undefined
}

// only letters not available
// only numbers not available
// available symbols:  \s  A-Z  a-z  0-9  #  /  -
export const streetAddress = (value: any): string | undefined => {
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
  return undefined
}
