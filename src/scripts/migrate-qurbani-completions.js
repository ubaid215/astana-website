import { config } from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../lib/db/mongodb.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Configuration setup
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '..', '.env.local');

// Enhanced logger (simplified for migration)
const logger = {
  info: (message) => console.log(`ℹ️ ${message}`),
  error: (message, error) => {
    console.error(`❌ ${message}`);
    if (error) console.error(`Error Details: ${error.message}`);
  },
  success: (message) => console.log(`✅ ${message}`),
};

// Initialize environment
function initialize() {
  logger.info('Initializing environment...');
  
  if (!existsSync(envPath)) {
    logger.error(`.env.local file not found at ${envPath}`);
    process.exit(1);
  }
  
  config({ path: envPath });
  
  // Verify required environment variables
  const requiredVars = ['MONGODB_URI'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  
  logger.success('Environment configuration verified');
}

// Dynamically import the User model and handle potential import errors
let User;

async function migrateUsers() {
  try {
    // Initialize environment
    initialize();

    // Connect to MongoDB using your existing connectDB
    await connectDB();
    console.log('[Migration] Connected to MongoDB at', new Date().toISOString());

    // Import User model after connection
    const { default: UserModule } = await import('../lib/db/models/User.js');
    User = UserModule;
    if (!User || typeof User.find !== 'function') {
      throw new Error('User model is not a valid Mongoose model');
    }
    console.log('[Migration] Successfully imported User model');

    // Fetch all users
    const users = await User.find();
    console.log('[Migration] Found', users.length, 'users to process');

    let updatedCount = 0;

    // Iterate over each user and initialize qurbaniCompletions if missing
    for (const user of users) {
      if (!user.qurbaniCompletions || user.qurbaniCompletions.length === 0) {
        user.qurbaniCompletions = []; // Initialize as an empty array
        await user.save();
        updatedCount++;
        console.log('[Migration] Initialized qurbaniCompletions for user:', user._id.toString(), user.email);
      } else {
        console.log('[Migration] qurbaniCompletions already exists for user:', user._id.toString(), user.email);
      }
    }

    console.log('[Migration] Successfully updated', updatedCount, 'users at', new Date().toISOString());
  } catch (error) {
    console.error('[Migration] Error:', {
      message: error.message,
      stack: error.stack,
    });
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('[Migration] Disconnected from MongoDB');
  }
}

// Run the migration
migrateUsers().catch((err) => {
  console.error('[Migration] Fatal error:', err);
  process.exit(1);
});