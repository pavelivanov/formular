import React from 'react'
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom'

import './App.css'

import ShippingForm from './pages/ShippingForm'
import PaymentForm from './pages/PaymentForm'


const Nav = () => (
  <ul className="nav">
    <NavLink to="/shipping-form" activeClassName="active">Just shipping form</NavLink>
    <NavLink to="/payment-form" activeClassName="active">Payment form</NavLink>
  </ul>
)

const App = () => (
  <Router>
    <div className="wrapper">
      <Nav />
      <Route path="/shipping-form" component={ShippingForm} />
      <Route path="/payment-form" component={PaymentForm} />
    </div>
  </Router>
)



export default App
