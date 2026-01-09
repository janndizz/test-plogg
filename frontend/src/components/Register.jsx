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
import { FaEnvelope, FaUser, FaLock, FaLockOpen } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

const Register = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // THÊM DÒNG NÀY
  const [loading, setLoading] = useState(false);

  const handleRegisterChange = (e) => {
    setRegisterData({ 
      ...registerData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage(''); // THÊM DÒNG NÀY

    // Validate password match
    if (registerData.password !== registerData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    // Validate password strength
    if (registerData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/users/register', {
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        email: registerData.email,
        password: registerData.password
      });
      
      if (res.data.success) {
        setSuccessMessage(res.data.message); // SỬA DÒNG NÀY
        
        // KHÔNG đăng nhập ngay, chỉ thông báo
        // Redirect đến login sau 5 giây
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } else {
        setError(res.data.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
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
        setError(res.data.message || 'Đăng ký Google thất bại');
      }
    } catch (err) {
      console.error('Google register error:', err);
      setError(err.response?.data?.message || 'Đăng ký Google thất bại. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setError('Đăng ký Google thất bại. Vui lòng thử lại.');
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="mb-1">Đăng Ký Tài Khoản</h2>
                <p className="text-muted">Tạo tài khoản mới của bạn</p>
              </div>

              {/* Social Login */}
              <div className="text-center mb-4">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  useOneTap
                  text="signup_with"
                  shape="rectangular"
                  size="large"
                  width="100%"
                  locale="vi"
                  theme="outline"
                />
                
                <div className="position-relative divider mt-3">
                  <hr />
                  <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small">
                    Hoặc đăng ký với email
                  </span>
                </div>
              </div>

              {/* Hiển thị thông báo thành công */}
              {successMessage && (
                <Alert variant="success" className="small mb-3">
                  <Alert.Heading className="h6">Đăng ký thành công!</Alert.Heading>
                  <p className="mb-0">{successMessage}</p>
                  <div className="mt-2">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Đang chuyển hướng đến trang đăng nhập...</span>
                  </div>
                </Alert>
              )}

              {/* Hiển thị lỗi */}
              {error && !successMessage && (
                <Alert variant="danger" className="small mb-3">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleRegister}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted">Họ</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light border-end-0">
                          <FaUser className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="lastName"
                          placeholder="Nhập họ của bạn"
                          value={registerData.lastName}
                          onChange={handleRegisterChange}
                          required
                          className="border-start-0"
                          disabled={loading || successMessage}
                          autoComplete="family-name"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted">Tên</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light border-end-0">
                          <FaUser className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="firstName"
                          placeholder="Nhập tên của bạn"
                          value={registerData.firstName}
                          onChange={handleRegisterChange}
                          required
                          className="border-start-0"
                          disabled={loading || successMessage}
                          autoComplete="given-name"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Email</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-end-0">
                      <FaEnvelope className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Nhập địa chỉ email"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      required
                      className="border-start-0"
                      disabled={loading || successMessage}
                      autoComplete="email"
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Mật khẩu</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-end-0">
                      <FaLock className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      required
                      className="border-start-0"
                      disabled={loading || successMessage}
                      autoComplete="new-password"
                    />
                  </InputGroup>
                  <Form.Text className="text-muted small">
                    Mật khẩu phải có ít nhất 6 ký tự
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small text-muted">Xác nhận mật khẩu</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-end-0">
                      <FaLockOpen className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      placeholder="Nhập lại mật khẩu"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      required
                      className="border-start-0"
                      disabled={loading || successMessage}
                      autoComplete="new-password"
                    />
                  </InputGroup>
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
                      Đang Đăng Ký...
                    </>
                  ) : successMessage ? 'Đăng Ký Thành Công!' : 'Đăng Ký'}
                </Button>

                <div className="text-center">
                  <p className="mb-0 text-muted">
                    Đã có tài khoản?{' '}
                    <Link 
                      to="/login" 
                      className="text-decoration-none fw-semibold text-primary"
                    >
                      Đăng nhập ngay
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

export default Register;