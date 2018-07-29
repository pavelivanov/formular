import React, { Component } from 'react'


class FormConnector extends Component {

  constructor(props) {
    super()

    const { form, group } = props

    this.isForm   = Boolean(form)
    this.form     = form
    this.group    = group
  }

  componentWillReceiveProps(nextProps) {
    const { form, group } = this.props
    const { form: newForm, group: newGroup } = nextProps

    if (this.isForm) {
      // TODO mbe it's better to create some name to Form and Group and compare it?
    }
    else {
      const formNames     = Object.keys(group.forms)
      const newFormNames  = Object.keys(newGroup.forms)
      const isChanged = JSON.stringify(formNames) !== JSON.stringify(newFormNames)

      if (isChanged) {
        this.group = newGroup
      }
    }
  }

  render() {
    const { children } = this.props


  }
}

export default FormConnector
