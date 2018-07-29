import React, { PureComponent } from 'react'


const formEvents = [ 'replace', 'change', 'set values', 'unset values' ] // TODO move to utils

const connect = (formGroup) => {

  return (Component) => {

    class WrappedComponent extends PureComponent {

      constructor() {
        super()

        this.state = {
          _formStateId: 1,
        }
      }

      componentWillMount() {
        formEvents.forEach((eventName) => {
          formGroup.on(eventName, this.updateState)
        })
      }

      componentWillUnmount() {
        formEvents.forEach((eventName) => {
          formGroup.off(eventName, this.updateState)
        })
      }

      updateState = () => {
        const { _formStateId } = this.state

        this.setState({
          _formStateId: _formStateId + 1,
        })
      }

      render() {

        return (
          <Component
            {...this.state}
            {...this.props}
          />
        )
      }
    }

    return WrappedComponent
  }
}


export default connect
