const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const User = require('../lib/db/models/User');

// Load environment variables from correct location
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

async function registerAdmin() {
  try {
    console.log('\n🚀 Starting admin registration process...');

    // Verify environment variables
    if (!process.env.MONGODB_URI) {
      throw new Error('❌ MONGODB_URI is not defined in .env.local');
    }

    // Verify User model
    if (!User || typeof User.findOne !== 'function') {
      throw new Error('❌ User model is not properly defined');
    }

    // Connect to MongoDB
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // Keep this option if you want to set a timeout
    });
    console.log('✅ MongoDB connected successfully');

    // Check for existing admin
    console.log('\n🔍 Checking for existing admin...');
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('ℹ️ Admin already exists');
      return;
    }

    // Create admin user
    console.log('\n👤 Creating new admin user...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('Admin123!', saltRounds);

    const admin = new User({
      name: 'System Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      isAdmin: true,
      isVerified: true,
    });

    await admin.save();
    console.log('\n🎉 Admin registered successfully!');
    console.log('   Email: admin@example.com');
    console.log('   Password: Admin123! (change this immediately)');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.name === 'MongoServerError') {
      console.error('   MongoDB Error Code:', error.code);
    }
  } finally {
    // Disconnect from MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
    process.exit(0);
  }
}

// Run the script
registerAdmin();