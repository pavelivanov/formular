import { Formx } from './util'
import { required, streetAddress } from './util/validation'
import { telephone } from '../examples/util/validation'

describe('Form', () => {

  let form

  before(() => {
    form = new Formx({
      fields: {
        address: [ required, streetAddress ],
        telephone: [ telephone ],
      },
    })
  })

  it('should have empty values before initial', () => {
    assert.deepEqual(form.getValues(), { address: '', telephone: '' })
  })

  it('should set initial values', () => {
    form.setInitialValues({
      address: 'New York',
      telephone: '+1 201 123-45-67',
    })

    assert.deepEqual(form.getValues(), { address: 'New York', telephone: '+1 201 123-45-67' })
  })

  it('should not override existing values', () => {
    form.setValues({
      telephone: '',
      address: 'Los Angeles'
    })
    form.setInitialValues({
      address: 'New York',
    })

    assert.deepEqual(form.getValues(), { address: 'Los Angeles', telephone: '' })
  })
})
