import { Form, Field, FormGroup } from '../src'
import { required, streetAddress, telephone } from './util/validation'

const getHandlers = (form: any, eventName: string): Function[] => {
  const event = form._events.events[eventName]
  return event ? event.handlers : []
}


describe('form', () => {

  describe('initial values', () => {

    it('should contain empty initial values on init', () => {
      const form = new Form({
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

      const form = new Form({
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

      const form = new Form({
        fields: {
          address: [],
          telephone: [],
        },
        initialValues,
      })

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

      const form = new Form({
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

      const form = new Form({
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

  })

  describe('submit', () => {

    const asyncDelay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

    it('captured values match returned values even if set() is attempted during validation', async () => {
      const form = new Form({
        fields: {
          name: {
            validate: [ async () => { await asyncDelay(20) } ],
            value: 'initial',
          },
        },
      })

      const submitPromise = form.submit()

      form.fields.name.set('changed-during-submit')

      const { values } = await submitPromise

      expect(values.name).toBe('initial')
      expect(form.fields.name.state.value).toBe('initial')
    })

    it('toggles isSubmitting around validation', async () => {
      const form = new Form({
        fields: {
          name: {
            validate: [ async () => { await asyncDelay(10) } ],
            value: 'x',
          },
        },
      })

      expect(form.state.isSubmitting).toBe(false)

      const p = form.submit()
      expect(form.state.isSubmitting).toBe(true)

      await p
      expect(form.state.isSubmitting).toBe(false)
      expect(form.state.isSubmitted).toBe(true)
    })

    it('unlocks fields even when a validator throws', async () => {
      const form = new Form({
        fields: {
          name: {
            validate: [ () => { throw new Error('boom') } ],
            value: 'x',
          },
        },
      })

      let caught: unknown
      try {
        await form.submit()
      }
      catch (err) {
        caught = err
      }

      expect(caught).toBeDefined()
      expect(form.state.isSubmitting).toBe(false)

      form.fields.name.set('after-submit')
      expect(form.fields.name.state.value).toBe('after-submit')
    })

  })

  describe('validation', () => {

    let form: any

    beforeEach(() => {
      form = new Form({
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

    it('should return empty errors', async () => {
      await form.validate()
      const errors = form.getErrors()

      expect(errors).toBe(null)
    })

    it('should return fields errors', async () => {
      form.fields.address.set('Wrong address # $')

      await form.validate()
      const errors = form.getErrors()

      expect(errors).toStrictEqual({ address: 'Must be a valid street address' })
    })

  })
})

describe('form group', () => {

  let formGroup: any

  beforeEach(() => {
    const shippingForm = new Form({
      fields: {
        address: [ required, streetAddress ],
        telephone: [ telephone ],
      },
    })

    const billingForm = new Form({
      fields: {
        address: [ required, streetAddress ],
      },
    })

    const creditCardForm = new Form({
      fields: {
        cardNumber: [ required ],
      },
    })

    formGroup = new FormGroup({
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

  it('should return empty errors', async () => {
    const values = {
      shipping: {
        address: 'Los Angeles',
      },
      billing: {
        address: 'Los Angeles',
      },
      creditCard: {
        cardNumber: '4242424242424242',
      },
    }

    formGroup.setValues(values)

    await formGroup.validate()
    const errors = formGroup.getErrors()

    expect(errors).toBe(null)
  })

  it('should return fields errors', async () => {
    const values = {
      shipping: {
        address: 'Wrong address # $',
      },
      billing: {
        address: 'Los Angeles',
      },
      creditCard: {
        cardNumber: '4242424242424242',
      },
    }

    formGroup.setValues(values)

    await formGroup.validate()
    const errors = formGroup.getErrors()

    expect(errors).toStrictEqual({ shipping: { address: 'Must be a valid street address' } })
  })

  describe('subscription lifecycle', () => {

    it('replace() unsubscribes handlers from the old forms', () => {
      const oldForm = new Form({ fields: { a: [] } })
      const newForm = new Form({ fields: { b: [] } })
      const group = new FormGroup({ x: oldForm })

      const beforeReplace = getHandlers(oldForm, 'change').length
      expect(beforeReplace).toBeGreaterThan(0)

      group.replace({ x: newForm })

      const afterReplace = getHandlers(oldForm, 'change').length
      expect(afterReplace).toBe(0)
    })

    it('replace() does not stack handlers across calls', () => {
      const form = new Form({ fields: { a: [] } })
      const group = new FormGroup({ x: form })

      for (let i = 0; i < 5; i++) {
        group.replace({ x: form })
      }

      expect(getHandlers(form, 'change').length).toBe(1)
    })

    it('attachForms subscribes newly attached forms', () => {
      const group = new FormGroup({})
      const form = new Form({ fields: { a: [] } })

      group.attachForms({ extra: form })

      expect(getHandlers(form, 'change').length).toBeGreaterThan(0)
    })

    it('detachForms unsubscribes dropped forms', () => {
      const form = new Form({ fields: { a: [] } })
      const group = new FormGroup({ x: form })

      const before = getHandlers(form, 'change').length
      expect(before).toBeGreaterThan(0)

      group.detachForms([ 'x' ])

      expect(getHandlers(form, 'change').length).toBe(0)
      expect(group.forms.x).toBeUndefined()
    })

    it('re-attaching a detached form does not leak handlers', () => {
      const form = new Form({ fields: { a: [] } })
      const group = new FormGroup({ x: form })

      group.detachForms([ 'x' ])
      group.attachForms({ x: form })

      expect(getHandlers(form, 'change').length).toBe(1)
    })

  })

  describe('submit lock', () => {

    const asyncDelay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

    it('blocks set() on any form during submit and restores after', async () => {
      const shippingForm = new Form({
        fields: {
          address: {
            validate: [ async () => { await asyncDelay(20) } ],
            value: 'initial',
          },
        },
      })
      const billingForm = new Form({
        fields: { address: { value: 'bill-initial' } },
      })
      const group = new FormGroup({ shipping: shippingForm, billing: billingForm })

      const submitPromise = group.submit()

      shippingForm.fields.address.set('mid-submit')
      billingForm.fields.address.set('mid-submit')

      const { values } = await submitPromise

      expect(values.shipping.address).toBe('initial')
      expect(values.billing.address).toBe('bill-initial')

      shippingForm.fields.address.set('after')
      expect(shippingForm.fields.address.state.value).toBe('after')
    })

  })

})

describe('events', () => {

  it('a throwing handler does not prevent later handlers from running', () => {
    jest.useFakeTimers()

    try {
      const form = new Form({ fields: { a: [] } })
      let ran = 0

      form.on('change', () => { throw new Error('bad handler') })
      form.on('change', () => { ran++ })
      form.on('change', () => { ran++ })

      form.fields.a.set('x')

      expect(ran).toBe(2)
    }
    finally {
      jest.clearAllTimers()
      jest.useRealTimers()
    }
  })

  it('schedules a deferred rethrow for each thrown handler error', () => {
    jest.useFakeTimers()

    try {
      const form = new Form({ fields: { a: [] } })
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      form.on('change', () => { throw new Error('e1') })
      form.on('change', () => { throw new Error('e2') })
      form.on('change', () => {})

      form.fields.a.set('x')

      const rethrowCalls = setTimeoutSpy.mock.calls.filter((call) => {
        const [ fn, delay ] = call as [ unknown, number ]
        return delay === 0 && typeof fn === 'function'
      })
      expect(rethrowCalls.length).toBe(2)

      setTimeoutSpy.mockRestore()
    }
    finally {
      jest.clearAllTimers()
      jest.useRealTimers()
    }
  })

})

describe('field', () => {

  describe('setRef', () => {

    type FakeNode = {
      listeners: { [key: string]: number }
      addEventListener: (name: string) => void
      removeEventListener: (name: string) => void
    }

    const makeNode = (): FakeNode => {
      const listeners: { [key: string]: number } = { focus: 0, blur: 0 }
      return {
        listeners,
        addEventListener(name) { listeners[name] = (listeners[name] || 0) + 1 },
        removeEventListener(name) { listeners[name] = (listeners[name] || 0) - 1 },
      }
    }

    it('removes listeners from the previous node when rebinding', () => {
      const field = new Field()
      const a = makeNode()
      const b = makeNode()

      field.setRef(a as unknown as HTMLInputElement)
      field.setRef(b as unknown as HTMLInputElement)

      expect(a.listeners.focus).toBe(0)
      expect(a.listeners.blur).toBe(0)
      expect(b.listeners.focus).toBe(1)
      expect(b.listeners.blur).toBe(1)
    })

    it('is a no-op when called with the same node', () => {
      const field = new Field()
      const node = makeNode()

      field.setRef(node as unknown as HTMLInputElement)
      field.setRef(node as unknown as HTMLInputElement)
      field.setRef(node as unknown as HTMLInputElement)

      expect(node.listeners.focus).toBe(1)
      expect(node.listeners.blur).toBe(1)
    })

    it('unsetRef clears listeners and node', () => {
      const field = new Field()
      const node = makeNode()

      field.setRef(node as unknown as HTMLInputElement)
      field.unsetRef()

      expect(node.listeners.focus).toBe(0)
      expect(node.listeners.blur).toBe(0)
      expect(field.node).toBeUndefined()
    })

  })

})
