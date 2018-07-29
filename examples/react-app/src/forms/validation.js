const isEmpty = value => typeof value === 'undefined' || value === null || value === '' || /^\s+$/.test(value)


export const required = (value) => {
  if (isEmpty(value)) {
    return 'Required'
  }
}

export const zipCode = (value) => {
  if (!isEmpty(value) && !/^\d{5}(?:[-\s]\d{4})?$/.test(value)) {
    return 'Must be a valid zip code'
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
  if (!isEmpty(value) && !(/\d+/.test(value) && /[A-Za-z#/-]+/.test(value))) {
    return 'Must be a valid street address'
  }
}

export const minLength = (length) => (value) => {
  if (!isEmpty(value) && String(value).length < length) {
    return `Must be at least ${length} characters`
  }
}


const _cardNumber = ((digits) => (cardNum) => {
  if (isEmpty(cardNum)) {
    return false
  }

  if (String(cardNum).length < 14) {
    return true
  }

  cardNum = String(cardNum).replace(/\s+/g, '')

  let sum = 0
  let digit = 0
  let even = true
  let i = cardNum.length

  while (i--) {
    digit = Number(cardNum[i])
    sum += (even = !even) ? digits[digit] : digit
  }

  if (sum <= 0 || sum % 10 !== 0) {
    return true
  }
})([ 0, 2, 4, 6, 8, 1, 3, 5, 7, 9 ])

export const cardNumber = (value) => {
  if (_cardNumber(value)) {
    return 'Must be a valid card number'
  }
}


const _expDate = (value) => {
  if (isEmpty(value)) {
    return false
  }

  if (!/^(0[1-9]|1[0-2])(1[6-9]|[2-9][0-9])$/g.test(value)) {
    return true
  }

  const valueMonth  = Number(value.substr(0, 2))
  const valueYear   = Number(`20${value.substr(2)}`)
  const currDate    = new Date()
  const currYear    = currDate.getFullYear()
  const currMonth   = currDate.getMonth()

  if (
    valueYear < currYear
    || (valueYear === currYear && valueMonth < currMonth)
  ) {
    return true
  }
}

export const expDate = (value) => {
  if (_expDate(value)) {
    return 'Must be a valid date'
  }
}


export const cardCVV = (value) => {
  if (!isEmpty(value) && !/^[0-9]{3,4}$/.test(value)) {
    return 'Invalid CVV/CVC'
  }
}


const asyncValidation = (isValid) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(isValid)
    }, 2000)
  })

export const successAsyncValidation = async () => {
  console.log(333)

  const isValid = await asyncValidation(true)

  console.log(444)

  if (!isValid) {
    return 'Async validation failed'
  }
}

export const failAsyncValidation = async () => {
  const isValid = await asyncValidation(false)

  if (!isValid) {
    return 'Async validation failed'
  }
}
