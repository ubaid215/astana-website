#!/usr/bin/env node
import mongoose from 'mongoose';
import axios from 'axios';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Configuration setup
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '..', '.env.local');

// Enhanced logger with colors
const logger = {
  info: (message) => console.log('\x1b[36m%s\x1b[0m', `ℹ️ ${message}`),
  success: (message) => console.log('\x1b[32m%s\x1b[0m', `✅ ${message}`),
  warn: (message) => console.log('\x1b[33m%s\x1b[0m', `⚠️ ${message}`),
  error: (message, error) => {
    console.error('\x1b[31m%s\x1b[0m', `❌ ${message}`);
    if (error) {
      console.error('\x1b[31m%s\x1b[0m', `Error Details: ${error.message}`);
      if (error.response) {
        console.error('\x1b[31m%s\x1b[0m', `Status: ${error.response.status}`);
        console.error('\x1b[31m%s\x1b[0m', `Data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
};

// Initialize environment
function initialize() {
  logger.info('Initializing test environment...');
  
  if (!existsSync(envPath)) {
    logger.error(`.env.local file not found at ${envPath}`);
    process.exit(1);
  }
  
  config({ path: envPath });
  
  // Verify required environment variables
  const requiredVars = ['MONGODB_URI', 'NEXTAUTH_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  
  logger.success('Environment configuration verified');
}

// MongoDB connection helper
async function connectDB() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10
    });
    logger.success('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed', error);
    process.exit(1);
  }
}

// API Health Check
async function testAPIHealth() {
  try {
    logger.info('Testing API health endpoint...');
    const response = await axios.get(`${process.env.NEXTAUTH_URL}/api/health`, {
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    
    if (response.status !== 200) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
    
    logger.success(`API health check passed (Status: ${response.status})`);
    return true;
  } catch (error) {
    logger.warn('API health endpoint not found, testing fallback endpoints...');
    
    // Test alternative endpoints
    const endpoints = [
      '/api/auth/providers',
      '/admin/login',
      '/'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const res = await axios.get(`${process.env.NEXTAUTH_URL}${endpoint}`, {
          timeout: 3000
        });
        logger.success(`Fallback endpoint accessible: ${endpoint} (Status: ${res.status})`);
        return true;
      } catch (e) {
        logger.warn(`Endpoint ${endpoint} not available`);
      }
    }
    
    throw new Error('No API endpoints responded successfully');
  }
}

// Main test function
async function runTests() {
  initialize();
  await connectDB();

  try {
    // Test MongoDB collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.success(`Found ${collections.length} collections in database`);
    
    // Test API connectivity
    await testAPIHealth();
    
    logger.success('🎉 All tests passed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Test failed', error);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      logger.info('MongoDB connection closed');
    }
  }
}

// Run tests
await runTests();