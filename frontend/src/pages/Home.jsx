import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = ({ user }) => {
  return (
    <div className="text-center py-5">
      <h1 className="mb-4">Welcome to Our Application</h1>
      {user ? (
        <Card className="mx-auto" style={{ maxWidth: '500px' }}>
          <Card.Body>
            <Card.Title>Xin chào {user.firstName} {user.lastName}!</Card.Title>
            <Card.Text>
              Email: {user.email}
            </Card.Text>
            <Button variant="primary">Go to Dashboard</Button>
          </Card.Body>
        </Card>
      ) : (
        <div>
          <p className="lead mb-4">Vui lòng đăng nhập hoặc đăng ký để tiếp tục</p>
          <div className="d-flex justify-content-center gap-3">
            <Button as={Link} to="/login" variant="primary" size="lg">
              Đăng Nhập
            </Button>
            <Button as={Link} to="/register" variant="outline-primary" size="lg">
              Đăng Ký
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;