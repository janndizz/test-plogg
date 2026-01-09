import React, { useState } from 'react';
import { 
  Form, 
  Button, 
  Alert, 
  InputGroup, 
  Container, 
  Row, 
  Col, 
  Card,
  Spinner 
} from 'react-bootstrap';
import { FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get query parameters
  const searchParams = new URLSearchParams(location.search);
  const verified = searchParams.get('verified');
  const userEmail = searchParams.get('email');
  
  const [loginData, setLoginData] = useState({ 
    email: '', 
    password: '' 
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginChange = (e) => {
    setLoginData({ 
      ...loginData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/users/login', loginData);
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user);
        }
        
        // Hiển thị thông báo nếu mới verify email
        if (verified === 'true') {
          setSuccessMessage(`Đăng nhập thành công! Tài khoản của bạn đã được kích hoạt.`);
        }
        
        // Redirect về trang chủ sau 2 giây nếu có success message
        if (verified === 'true') {
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          navigate('/');
        }
      } else {
        setError(res.data.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      const res = await axios.post('http://localhost:5000/api/users/google-auth', {
        token: credentialResponse.credential
      });
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user);
        }
        
        navigate('/');
      } else {
        setError(res.data.message || 'Đăng nhập Google thất bại');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.response?.data?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="mb-1">Đăng Nhập</h2>
                <p className="text-muted">Chào mừng bạn trở lại</p>
              </div>

              {/* Hiển thị thông báo thành công nếu vừa verify email */}
              {verified === 'true' && userEmail && (
                <Alert variant="success" className="small mb-4">
                  <Alert.Heading className="h6">Xác nhận thành công!</Alert.Heading>
                  <p className="mb-0">
                    Email <strong>{decodeURIComponent(userEmail)}</strong> đã được xác nhận. 
                    Bây giờ bạn có thể đăng nhập.
                  </p>
                </Alert>
              )}

              {/* Social Login */}
              <div className="text-center mb-4">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  useOneTap
                  text="continue_with"
                  shape="rectangular"
                  size="large"
                  width="100%"
                  locale="vi"
                  theme="outline"
                />
                
                <div className="position-relative divider mt-3">
                  <hr />
                  <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small">
                    Hoặc đăng nhập với email
                  </span>
                </div>
              </div>

              {/* Hiển thị thông báo thành công sau khi login */}
              {successMessage && (
                <Alert variant="success" className="small mb-3">
                  {successMessage}
                  <div className="mt-2">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Đang chuyển hướng...</span>
                  </div>
                </Alert>
              )}

              {/* Hiển thị lỗi */}
              {error && !successMessage && (
                <Alert variant="danger" className="small mb-3">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Email</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-end-0">
                      <FaEnvelope className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Nhập email của bạn"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      required
                      className="border-start-0"
                      disabled={loading}
                      autoComplete="email"
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small text-muted">Mật khẩu</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-end-0">
                      <FaLock className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Nhập mật khẩu của bạn"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      required
                      className="border-start-0"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </InputGroup>
                  <div className="text-end mt-2">
                    <Link 
                      to="/forgot-password" 
                      className="text-decoration-none small text-primary"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-100 py-2 fw-semibold mb-3"
                  disabled={loading || successMessage}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Đang Đăng Nhập...
                    </>
                  ) : 'Đăng Nhập'}
                </Button>

                <div className="text-center">
                  <p className="mb-0 text-muted">
                    Chưa có tài khoản?{' '}
                    <Link 
                      to="/register" 
                      className="text-decoration-none fw-semibold text-primary"
                    >
                      Đăng ký ngay
                    </Link>
                  </p>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;