import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/Login';
import Register from './components/Register';
import Home from './pages/Home';
import Header from './components/Header';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Router>
        <div className="App">
          <Header user={user} onLogout={handleLogout} />
          <Container className="py-4">
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/login" element={
                user ? <Navigate to="/" /> : <Login onLoginSuccess={handleLoginSuccess} />
              } />
              <Route path="/register" element={
                user ? <Navigate to="/" /> : <Register onLoginSuccess={handleLoginSuccess} />
              } />
              <Route path="/verify-email-success" element={
                <div className="text-center py-5">
                  <h2>Email đã được xác nhận thành công!</h2>
                  <p>Bây giờ bạn có thể đăng nhập vào tài khoản của mình.</p>
                  <a href="/login" className="btn btn-primary">Đăng nhập</a>
                </div>
              } />
              <Route path="/verify-email-error" element={
                <div className="text-center py-5">
                  <h2>Xác nhận email thất bại</h2>
                  <p>Liên kết xác nhận không hợp lệ hoặc đã hết hạn.</p>
                  <a href="/" className="btn btn-primary">Trở về trang chủ</a>
                </div>
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Container>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;