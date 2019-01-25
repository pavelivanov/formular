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

  xdescribe('values', () => {

    let form

    beforeEach(() => {
      form = new Formx({
        fields: {
          address: [],
          telephone: [],
        },
      })
    })

    xit('setInitialValues() should not override existing values', () => {
      const existingValues = {
        address: 'Los Angeles',
        telephone: '',
      }

      form.setValues(existingValues)

      form.setInitialValues({
        address: 'New York',
      })

      expect(form.getValues()).toEqual(existingValues)
    })

  })

  xdescribe('validation', () => {

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
      const isValid = await form.address.validate()

      expect(isValid).toBe(true)

      form.fields.address.set('Wrong address # $')

      const isValid2 = await form.address.validate()

      expect(isValid2).toBe(false)
    })

  })
})

xdescribe('form group', () => {

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
        telephone: [ telephone ],
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

})
