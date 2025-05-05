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
        console.error('\x1b[31m%s\x1b[0m', `Data: ${JSON.stringify(error.response.data, null, 2)}`);
        
        // Check if response is HTML instead of JSON
        const contentType = error.response.headers['content-type'];
        if (contentType && contentType.includes('text/html')) {
          console.error('\x1b[31m%s\x1b[0m', `Received HTML instead of JSON!`);
          console.error('\x1b[31m%s\x1b[0m', `HTML Preview: ${error.response.data.substring(0, 300)}...`);
        }
      }
    }
  },
  debug: (title, data) => {
    console.log('\x1b[35m%s\x1b[0m', `🔍 ${title}:`);
    console.dir(data, { depth: null, colors: true });
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
    return true;
  } catch (error) {
    logger.error('MongoDB connection failed', error);
    return false;
  }
}

// Test database directly
async function testDBDirectly() {
  try {
    logger.info('Testing database connection and content...');
    
    // Test MongoDB collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.success(`Found ${collections.length} collections in database`);
    
    // Check for Users collection
    const userCollection = collections.find(c => c.name === 'users');
    if (userCollection) {
      const usersCount = await mongoose.connection.db.collection('users').countDocuments();
      logger.success(`Users collection found with ${usersCount} documents`);
      
      // Check if there are admin users
      const adminCount = await mongoose.connection.db.collection('users').countDocuments({ isAdmin: true });
      logger.success(`Found ${adminCount} admin users in the database`);
      
      if (adminCount === 0) {
        logger.warn('No admin users found in database!');
      }
    } else {
      logger.warn('Users collection not found in database');
    }
    
    return true;
  } catch (error) {
    logger.error('Database content test failed', error);
    return false;
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

// Test the new database connection check endpoint
async function testDBConnectionEndpoint() {
  try {
    logger.info('Testing database connection API endpoint...');
    const response = await axios.get(`${process.env.NEXTAUTH_URL}/api/test-db`, {
      timeout: 5000
    });
    
    logger.debug('DB Connection Test Response', response.data);
    logger.success('Database connection API test passed');
    return true;
  } catch (error) {
    logger.error('Database connection API test failed', error);
    return false;
  }
}

// Admin Login API Check
async function testAdminLoginAPI() {
  try {
    logger.info('Testing admin login API endpoint...');
    
    // First, let's check if the endpoint responds to OPTIONS
    try {
      const optionsResponse = await axios({
        method: 'OPTIONS',
        url: `${process.env.NEXTAUTH_URL}/api/admin/login`,
        timeout: 5000
      });
      logger.success(`OPTIONS request successful: ${optionsResponse.status}`);
    } catch (optionsError) {
      logger.warn('OPTIONS request failed (this might be normal)');
    }
    
    // Test with intentionally wrong credentials
    const testCredentials = {
      email: 'test@example.com',
      password: 'wrongpassword123'
    };
    
    logger.info('Sending admin login request with test credentials...');
    
    // Store raw response
    let rawResponse;
    
    try {
      const response = await axios.post(
        `${process.env.NEXTAUTH_URL}/api/auth/admin-login`,
        testCredentials,
        {
          timeout: 10000,
          validateStatus: () => true, // Accept any status code
          transformResponse: [(data) => {
            rawResponse = data;
            try {
              return JSON.parse(data);
            } catch (e) {
              return data;
            }
          }],
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      logger.debug('Response Status', response.status);
      logger.debug('Response Headers', response.headers);
      
      // Check if we received HTML instead of JSON
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('text/html')) {
        logger.error('Received HTML instead of JSON in response!');
        console.log('\x1b[31m%s\x1b[0m', `HTML Preview: ${rawResponse.substring(0, 300)}...`);
        return false;
      }
      
      // For 401, 403, etc., this is expected with fake credentials
      if (response.status === 401 || response.status === 403) {
        logger.success(`Admin login API correctly rejected invalid credentials (Status: ${response.status})`);
        return true;
      }
      
      // Log unexpected responses
      logger.warn(`Unexpected response status: ${response.status}`);
      logger.debug('Response Data', response.data);
      
      if (response.status >= 200 && response.status < 300) {
        logger.warn('Login succeeded with test credentials! This is unusual and might indicate a security issue.');
      }
      
      return response.status < 500; // Consider test passed if not a server error
    } catch (error) {
      logger.error('Admin login API request failed', error);
      return false;
    }
  } catch (error) {
    logger.error('Admin login API test failed completely', error);
    return false;
  }
}

// Profile API Check
async function testProfileAPI() {
  try {
    logger.info('Testing profile API endpoint...');
    const response = await axios.get(`${process.env.NEXTAUTH_URL}/api/profile`, {
      timeout: 5000,
      maxRedirects: 0,
      validateStatus: () => true // Accept any status code for inspection
    });
    
    logger.info(`Response status for /api/profile: ${response.status}`);
    
    if (response.status === 401) {
      logger.success('Profile access blocked (unauthenticated, 401)');
      return true;
    } else {
      logger.warn(`Unexpected status code: ${response.status}`);
      return response.status < 500; // Consider test passed if not a server error
    }
  } catch (error) {
    logger.error('Profile API test failed', error);
    return false;
  }
}

// Main test function
async function runTests() {
  initialize();
  const dbConnected = await connectDB();
  
  if (!dbConnected) {
    logger.error('Cannot proceed with tests due to database connection failure');
    process.exit(1);
  }

  try {
    // Test database content
    await testDBDirectly();
    
    // Test API connectivity
    await testAPIHealth();
    
    // Test database connection endpoint
    await testDBConnectionEndpoint();
    
    // Test admin login API
    const adminLoginSuccess = await testAdminLoginAPI();
    if (!adminLoginSuccess) {
      logger.error('Admin login API test failed - this is the endpoint you are having trouble with');
    }
    
    // Test Profile API
    await testProfileAPI();
    
    logger.success('🎉 Tests completed!');
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

// Run tests with proper error handling
runTests().catch(error => {
  logger.error('Test execution failed', error);
  process.exit(1);
});