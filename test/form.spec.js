import Formx, { FormxGroup } from '../src'
import { required, streetAddress, telephone } from './util/validation'


describe('form', () => {

  describe('initial values', () => {

    it('should contain empty initial values on init', () => {
      const form = new Formx({
        fields: {
          address: [],
          telephone: [],
        },
      })

      expect(form.getValues()).toEqual({ address: '', telephone: '' })
    })

    it('should contain same initial values on init as in settings', () => {
      const initialValues = {
        address: 'New York',
        telephone: '+1 201 123-45-67',
      }

      const form = new Formx({
        fields: {
          address: [],
          telephone: [],
        },
        initialValues,
      })

      expect(form.getValues()).toEqual(initialValues)
    })

    it('should contain correct initial values after setting them', () => {
      const initialValues = {
        address: 'New York',
        telephone: '+1 201 123-45-67',
      }

      const form = new Formx({
        fields: {
          address: [],
          telephone: [],
        },
      })

      form.setInitialValues(initialValues)

      expect(form.getValues()).toEqual(initialValues)
    })

    it('should contain correct initial values after resetting form', () => {
      const initialValues = {
        address: 'New York',
        telephone: '+1 201 123-45-67',
      }

      const newValues = {
        address: 'Los Angeles',
        telephone: '',
      }

      const form = new Formx({
        fields: {
          address: [],
          telephone: [],
        },
        initialValues,
      })

      form.setValues(newValues)

      expect(form.getValues()).toEqual(newValues)

      form.unsetValues()

      expect(form.getValues()).toEqual(initialValues)
    })

    it('should contain correct initial values after unset them #2', () => {
      const initialValues = {
        address: 'New York',
        telephone: '+1 201 123-45-67',
      }

      const newValues = {
        address: 'Los Angeles',
        telephone: '',
      }

      const form = new Formx({
        fields: {
          address: [],
          telephone: [],
        },
      })

      form.setInitialValues(initialValues)
      form.setValues(newValues)

      expect(form.getValues()).toEqual(newValues)

      form.unsetValues()

      expect(form.getValues()).toEqual(initialValues)
    })

  })

  describe('validation', () => {

    let form

    beforeEach(() => {
      form = new Formx({
        fields: {
          address: {
            validate: [ required, streetAddress ],
            value: 'New York',
          },
        },
      })
    })

    it('should be valid at start', async () => {
      const isValid = await form.validate()

      expect(isValid).toBe(true)
    })

    it('should fail on wrong address', async () => {
      form.fields.address.set('Wrong address # $')

      const isValid = await form.validate()

      expect(isValid).toBe(false)
    })

    it('should validate one field', async () => {
      const error1 = await form.fields.address.validate()

      expect(error1).toBe(undefined)

      form.fields.address.set('Wrong address # $')

      const error2 = await form.fields.address.validate()

      expect(error2).toBe('Must be a valid street address')
    })

  })
})

describe('form group', () => {

  let formGroup

  beforeEach(() => {
    const shippingForm = new Formx({
      fields: {
        address: [ required, streetAddress ],
        telephone: [ telephone ],
      },
    })

    const billingForm = new Formx({
      fields: {
        address: [ required, streetAddress ],
      },
    })

    const creditCardForm = new Formx({
      fields: {
        cardNumber: [ required ],
      },
    })

    formGroup = new FormxGroup({
      shipping: shippingForm,
      billing: billingForm,
      creditCard: creditCardForm,
    })
  })

  it('set values', () => {
    const values = {
      shipping: {
        address: 'Los Angeles',
      },
      creditCard: {
        cardNumber: '4242424242424242',
      },
    }

    const expectedValues = {
      billing: {
        address: '',
      },
      shipping: {
        address: 'Los Angeles',
        telephone: '',
      },
      creditCard: {
        cardNumber: '4242424242424242',
      },
    }

    formGroup.setValues(values)

    expect(formGroup.getValues()).toEqual(expectedValues)
    expect(formGroup.forms.shipping.getValues()).toEqual(expectedValues.shipping)
    expect(formGroup.forms.billing.getValues()).toEqual(expectedValues.billing)
    expect(formGroup.forms.creditCard.getValues()).toEqual(expectedValues.creditCard)
  })

})
