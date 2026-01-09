import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">My App</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
          </Nav>
          <Nav>
            {user ? (
              <>
                <Navbar.Text className="me-3">
                  Xin chào, {user.firstName} {user.lastName}
                </Navbar.Text>
                <Button variant="outline-light" onClick={onLogout}>
                  Đăng Xuất
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="me-2">
                  Đăng Nhập
                </Nav.Link>
                <Button as={Link} to="/register" variant="outline-light">
                  Đăng Ký
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;