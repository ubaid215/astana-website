import mongoose from 'mongoose';

// Enhanced connection handler with better error handling and debugging
class MongoDBConnection {
  constructor() {
    this.connection = null;
    this.promise = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async connect() {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    if (this.connection) {
      return this.connection;
    }

    try {
      if (!this.promise) {
        this.promise = mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 30000,
          maxPoolSize: 10,
          retryWrites: true,
          retryReads: true
        });

        this.connection = await this.promise;
        console.log('✅ MongoDB connected successfully');
        this.retryCount = 0; // Reset retry counter on successful connection
      }
      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      
      // Implement retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying connection (attempt ${this.retryCount})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * this.retryCount));
        return this.connect();
      }
      
      throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts`);
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      this.promise = null;
      console.log('🔌 MongoDB disconnected');
    }
  }
}

// Singleton instance
const mongoDB = new MongoDBConnection();

// Connection events for better debugging
mongoose.connection.on('connecting', () => {
  console.log('🔗 Connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

process.on('SIGINT', async () => {
  await mongoDB.disconnect();
  process.exit(0);
});

export default mongoDB;