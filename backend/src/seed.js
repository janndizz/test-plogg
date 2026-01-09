import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Starting database seeding...');

    // Xóa tất cả user cũ
    await User.deleteMany({});
    console.log('Old user data cleared');

    // Hash password trước khi tạo users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Tạo 5 user mẫu với password đã hash
    const users = [
      {
        firstName: 'Nguyễn',
        lastName: 'Văn A',
        email: 'nguyenvana@example.com',
        password: hashedPassword
      },
      {
        firstName: 'Trần',
        lastName: 'Thị B',
        email: 'tranthib@example.com',
        password: hashedPassword
      },
      {
        firstName: 'Lê',
        lastName: 'Văn C',
        email: 'levanc@example.com',
        password: hashedPassword
      },
      {
        firstName: 'Phạm',
        lastName: 'Thị D',
        email: 'phamthid@example.com',
        password: hashedPassword
      },
      {
        firstName: 'Hoàng',
        lastName: 'Văn E',
        email: 'hoangvane@example.com',
        password: hashedPassword
      }
    ];

    await User.insertMany(users);
    console.log('Users created successfully!');
    
    const createdUsers = await User.find({});
    console.log('\n=== Danh sách users đã tạo ===');
    createdUsers.forEach(user => {
      console.log(`- ${user.fullName} (${user.email})`);
    });
    
    console.log('\n=== Thông tin đăng nhập ===');
    console.log('Email: nguyenvana@example.com');
    console.log('Password: password123');
    console.log('(Tất cả users đều dùng chung password: password123)');
    
    console.log('\nSeeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();