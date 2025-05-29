import { config } from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../lib/db/mongodb.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Configuration setup
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '..', '.env.local');

// Enhanced logger
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

// Dynamically import the Participation model and handle potential import errors
let Participation;

async function migrateScreenshots() {
  try {
    // Initialize environment
    initialize();

    // Connect to MongoDB using your existing connectDB
    await connectDB();
    logger.info(`Connected to MongoDB at ${new Date().toISOString()}`);

    // Import Participation model after connection
    const { default: ParticipationModule } = await import('../lib/db/models/Participation.js');
    Participation = ParticipationModule;
    if (!Participation || typeof Participation.find !== 'function') {
      throw new Error('Participation model is not a valid Mongoose model');
    }
    logger.success('Successfully imported Participation model');

    // Fetch all participations with payment submissions
    const participations = await Participation.find({ 'paymentSubmissions.screenshot': { $exists: true, $ne: null } });
    logger.info(`Found ${participations.length} participations to process`);

    let updatedCount = 0;

    // Iterate over each participation and migrate screenshots
    for (const participation of participations) {
      let updated = false;
      for (const submission of participation.paymentSubmissions) {
        if (submission.screenshot && (!submission.screenshots || submission.screenshots.length === 0)) {
          submission.screenshots = [submission.screenshot];
          updated = true;
          logger.info(`Migrated screenshot for participation ${participation._id}, transaction ${submission.transactionId}`);
        }
      }
      if (updated) {
        await participation.save();
        updatedCount++;
      } else {
        logger.info(`No migration needed for participation ${participation._id}`);
      }
    }

    logger.success(`Successfully updated ${updatedCount} participations at ${new Date().toISOString()}`);
  } catch (error) {
    logger.error('Error during migration:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the migration
migrateScreenshots().catch((err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});