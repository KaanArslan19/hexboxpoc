import { jwtValidator } from '../utils/jwtValidator';

/**
 * Comprehensive authentication system validation on startup
 * This ensures all critical security configurations are properly set
 */
export function validateAuthenticationSystem(): void {
  console.log('🔒 Starting Authentication System Validation...\n');

  try {
    // Validate JWT secret
    jwtValidator.validateOnStartup();

    // Validate other critical environment variables
    validateEnvironmentVariables();

    // Validate MongoDB connection string (basic check)
    validateMongoDBConfig();

    console.log('✅ Authentication system validation completed successfully!\n');
  } catch (error) {
    console.error('❌ Authentication system validation failed:', error);
    process.exit(1);
  }
}

/**
 * Validate required environment variables
 */
function validateEnvironmentVariables(): void {
  const requiredVars = [
    'JWT_SECRET_KEY',
    'MONGODB_URI',
    'NEXT_PUBLIC_APP_BASE_URL'
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    throw new Error('Missing required environment variables');
  }

  console.log('✅ All required environment variables are set');
}

/**
 * Basic MongoDB URI validation
 */
function validateMongoDBConfig(): void {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }

  // Basic URI format validation
  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    console.warn('⚠️  MongoDB URI format may be incorrect (should start with mongodb:// or mongodb+srv://)');
  }

  console.log('✅ MongoDB configuration validated');
}

/**
 * Initialize authentication system validation
 * Call this early in your application startup
 */
export function initializeAuthValidation(): void {
  // Only run validation in production and development, skip in test environments
  if (process.env.NODE_ENV !== 'test') {
    validateAuthenticationSystem();
  }
}
