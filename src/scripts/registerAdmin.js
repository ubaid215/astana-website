import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';
import User from '../lib/db/models/User.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function registerAdmin() {
  try {
    console.log('\n🚀 Starting admin registration process...');

    if (!process.env.MONGODB_URI) {
      throw new Error('❌ MONGODB_URI is not defined in .env.local');
    }

    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');

    console.log('\n🔍 Checking for existing admin...');
    const existingAdmin = await User.findOne({ email: 'khanqahsaifia@gmail.com' });
    if (existingAdmin) {
      console.log('ℹ️ Admin already exists');
      console.log('Admin details:', {
        email: existingAdmin.email,
        isAdmin: existingAdmin.isAdmin,
        isVerified: existingAdmin.isVerified
      });
      return;
    }

    console.log('\n👤 Creating new admin user...');


    const admin = new User({
      name: 'System Admin',
      email: 'khanqahsaifia@gmail.com',
      password: 'Admin786@!', 
      isAdmin: true,
      isVerified: true,
    });

    await admin.save();
    console.log('\n🎉 Admin registered successfully!');
    console.log('   Email:', admin.email);
    console.log('   Password: Admin786@! (change this immediately)');
    console.log('   Hash:', admin.password); 


  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.name === 'MongoServerError') {
      console.error('   MongoDB Error Code:', error.code);
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
    process.exit(0);
  }
}

registerAdmin();