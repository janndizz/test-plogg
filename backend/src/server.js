import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDB from './config/db.js';

// Import routes - chỉ giữ routes user
import userRoutes from './routes/user/userRoutes.js';
// import passwordResetRoutes from './routes/user/passwordResetRoutes.js'; // Bỏ nếu không cần

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - chỉ giữ routes user
app.use('/api/users', userRoutes);
// app.use('/api/password-reset', passwordResetRoutes); // Bỏ nếu không cần

// Home route
app.get('/', (req, res) => {
  res.json({ 
    message: 'User API is running!',
    endpoints: {
      register: 'POST /api/users/register',
      login: 'POST /api/users/login',
      profile: 'GET /api/users/profile',
      googleAuth: 'POST /api/users/google-auth',
      googleCallback: 'GET /api/users/google/callback'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
});