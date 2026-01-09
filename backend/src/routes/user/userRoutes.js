import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const router = express.Router();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || '2f8d9e7a1b3c4d5f6g7h8i9j0k', {
    expiresIn: '30d',
  });
};

// REGISTER API - Fixed with email verification
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email đã được sử dụng' 
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      emailVerified: false
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // SỬA DÒNG NÀY TRONG REGISTER ROUTE:
    const verificationUrl = `http://localhost:5000/api/users/verify-email/${verificationToken}`;
    
    // Email content
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000000;">Xác nhận Email</h2>
        <p>Xin chào <strong>${user.fullName}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng xác nhận địa chỉ email của bạn để kích hoạt tài khoản:</p>
        <p style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; text-align: center;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            XÁC NHẬN EMAIL
          </a>
        </p>
        <p><strong>Lưu ý:</strong> Liên kết này sẽ hết hạn sau 5 phút.</p>
        <p>Bạn phải xác nhận email trước khi có thể đăng nhập.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p>Trân trọng,<br><strong>Lê Tuấn Nhàn</strong></p>
      </div>
    `;

    // Send verification email (bất đồng bộ)
    transporter.sendMail({
      from: `"Lê Tuấn Nhàn" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Xác nhận địa chỉ email',
      html: message
    }).catch(err => {
      console.error('Email send error:', err);
    });

    //KHÔNG TẠO TOKEN - KHÔNG CHO LOGIN NGAY
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.',
      requiresVerification: true,
      userEmail: user.email
    });
    
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// VERIFY EMAIL API
router.get('/verify-email/:token', async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email-error?message=Token không hợp lệ hoặc đã hết hạn`);
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Redirect đến trang login với thông báo thành công
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?verified=true&email=${encodeURIComponent(user.email)}`);
  } catch (error) {
    console.error('Verify email error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email-error?message=Lỗi server`);
  }
});

// LOGIN API
// LOGIN API - VẪN kiểm tra emailVerified
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng nhập email và mật khẩu' 
      });
    }

    // Find user - select password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Check if user has password
    if (!user.password) {
      return res.status(401).json({ 
        success: false,
        message: 'Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google.' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // KIỂM TRA emailVerified - BẮT BUỘC
    if (!user.emailVerified) {
      return res.status(401).json({ 
        success: false,
        message: 'Vui lòng xác nhận email trước khi đăng nhập. Kiểm tra hộp thư của bạn.' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server' 
    });
  }
});

// RESEND VERIFICATION EMAIL API
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy người dùng' 
      });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'Email đã được xác nhận' 
      });
    }
    
    // Generate new token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    
    // Gửi email (bất đồng bộ)
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    transporter.sendMail({
      from: `"Lê Tuấn Nhàn" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Xác nhận email đăng nhập',
      html: `<p>Click <a href="${verificationUrl}">here</a> để xác nhận email của bạn</p>`
    }).catch(console.error);
    
    res.json({ 
      success: true, 
      message: 'Đã gửi lại email xác nhận' 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server' 
    });
  }
});

// GOOGLE AUTH APIs
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage' // Changed for token exchange
);

// Google Token Exchange
router.post('/google-auth', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        message: 'Google token không hợp lệ' 
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log('🔍 Google payload:', payload); // Debug
    
    const { 
      email, 
      given_name = '',     // Default empty string
      family_name = '',    // Default empty string  
      sub 
    } = payload;

    // Xử lý tên nếu không có
    let firstName = given_name;
    let lastName = family_name;
    
    // Nếu không có family_name, split từ given_name
    if (!family_name && given_name) {
      const nameParts = given_name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || 'User';
    }
    
    // Nếu cả hai đều empty, dùng email
    if (!firstName && !lastName) {
      firstName = email.split('@')[0];
      lastName = 'Google User';
    }

    console.log(`👤 Processed name: ${firstName} ${lastName}`);

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { googleId: sub }
      ]
    });

    if (!user) {
      // Create new user with Google
      user = await User.create({
        firstName,
        lastName,
        email,
        googleId: sub,
        emailVerified: true // Google users are automatically verified
      });
      console.log('New Google user created:', user.email);
    } else if (!user.googleId) {
      // Link Google account to existing email
      user.googleId = sub;
      user.emailVerified = true;
      await user.save();
      console.log('Linked Google to existing user:', user.email);
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id);

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified
      }
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Xác thực Google thất bại',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET USER PROFILE
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        message: 'Không tìm thấy token' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '2f8d9e7a1b3c4d5f6g7h8i9j0k');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ 
        message: 'Không tìm thấy người dùng' 
      });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(401).json({ 
      message: 'Token không hợp lệ' 
    });
  }
});

export default router;