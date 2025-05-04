const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

async function clearAuthSessions() {
  try {
    console.log('\n🔍 Starting NextAuth session cleanup...');

    // Verify MongoDB connection string
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env.local');
    }

    // Connect to MongoDB (modern connection without deprecated options)
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB connected successfully');

    // Check which collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📂 Available collections:', collections.map(c => c.name));

    // Clear NextAuth sessions - try different possible collection names
    let clearedCount = 0;
    
    // Try default NextAuth session collection
    if (collections.some(c => c.name === 'sessions')) {
      const result = await mongoose.connection.db.collection('sessions').deleteMany({});
      clearedCount += result.deletedCount;
      console.log(`\n🧹 Cleared ${result.deletedCount} records from 'sessions' collection`);
    }

    // Try alternative session collection names
    if (collections.some(c => c.name === 'nextauth_sessions')) {
      const result = await mongoose.connection.db.collection('nextauth_sessions').deleteMany({});
      clearedCount += result.deletedCount;
      console.log(`🧹 Cleared ${result.deletedCount} records from 'nextauth_sessions' collection`);
    }

    if (clearedCount === 0) {
      console.log('\n⚠️ No session records found to clear');
      console.log('NextAuth might be using a different session store or collection name');
    } else {
      console.log(`\n✅ Total cleared sessions: ${clearedCount}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
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
clearAuthSessions();