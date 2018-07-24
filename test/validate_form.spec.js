import { Formx } from './util'
import { required, streetAddress } from './util/validation'


describe('Form', () => {

  let validForm

  before(() => {
    validForm = new Formx({
      fields: {
        address: {
          validate: [ required, streetAddress ],
          value: 'New York',
        },
      },
    })
  })

  it('should be valid at start', () => {

    const isValid1 = validForm.validate()

    assert.isTrue(isValid1)

  })

  it('should fail on wrong address', () => {

    validForm.fields.address.set('Wrong address # $')

    const isValid2 = validForm.validate()

    assert.isFalse(isValid2)

  })
})
