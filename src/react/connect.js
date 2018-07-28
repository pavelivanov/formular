import React, { PureComponent } from 'react'


const connect = (opts) => {


  return (Component) => {

    class WrappedComponent extends PureComponent {

      constructor() {
        super()

        this.state = {

        }
      }


    }

    return WrappedComponent
  }
}


export default connect
