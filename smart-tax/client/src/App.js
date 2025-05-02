import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/pages/Login';
import Register from './components/pages/Register';
import AdminDashboard from './components/pages/admin/AdminDashboard'
import UserDashboard from './components/pages/user/UserDashboard'
import PaymentMethods from './components/pages/user/PaymentMethods';




function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        
        <Route path="/payment-methods" element={<PaymentMethods />} />

      </Routes>
    </Router>
  );
}

export default App;