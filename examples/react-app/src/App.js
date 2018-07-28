import React from 'react'
import { BrowserRouter as Router, Redirect, Route, NavLink } from 'react-router-dom'

import './App.css'

import ShippingForm from './pages/ShippingForm'
import PaymentPage from './pages/PaymentPage/PaymentPage'


const Nav = () => (
  <ul className="nav">
    <NavLink to="/shipping-form" activeClassName="active">Just shipping form</NavLink>
    <NavLink to="/payment-page" activeClassName="active">Payment page</NavLink>
  </ul>
)

// const App = () => (
//   <Router>
//     <div className="wrapper">
//       <Redirect to="/payment-page" />
//       <Nav />
//       <Route path="/shipping-form" component={ShippingForm} />
//       <Route path="/payment-page" component={PaymentPage} />
//     </div>
//   </Router>
// )

const App = () => (
  <PaymentPage />
)



export default App
