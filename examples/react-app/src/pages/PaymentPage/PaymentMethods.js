import React, { PureComponent } from 'react'
import { RadioGroup, Radio } from 'react-radio-group'


class PaymentMethods extends PureComponent {

  state = {
    paymentMethod: 'creditCard',
  }

  handleChange = (paymentMethod) => {
    const { onChange } = this.props

    this.setState({
      paymentMethod,
    }, () => {
      onChange(paymentMethod)
    })
  }

  render() {
    const { paymentMethod } = this.state
    const { className } = this.props

    return (
      <div className={className}>
        <RadioGroup name="paymentMethod" selectedValue={paymentMethod} onChange={this.handleChange}>
          <label>
            <Radio value="creditCard" />Credit card
          </label>
          <label>
            <Radio value="payPal" />PayPal
          </label>
        </RadioGroup>
      </div>
    )
  }
}

export default PaymentMethods
