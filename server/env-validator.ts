/**
 * Environment Variable Validator
 * 
 * Validates that all required environment variables are present and valid
 * before the application starts. This prevents runtime errors due to
 * misconfiguration.
 */

import { logger } from "./logger";

interface EnvVar {
  name: string;
  required: boolean;
  validate?: (value: string) => boolean;
  description: string;
}

const envVars: EnvVar[] = [
  // Core Configuration
  {
    name: 'NODE_ENV',
    required: true,
    validate: (value) => ['development', 'production', 'test'].includes(value),
    description: 'Application environment (development, production, or test)',
  },
  {
    name: 'PORT',
    required: false,
    validate: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0 && parseInt(value) < 65536,
    description: 'Port number for the application (default: 5000)',
  },

  // Database Configuration
  {
    name: 'DATABASE_URL',
    required: true,
    validate: (value) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
    description: 'PostgreSQL database connection string',
  },

  // Session Configuration
  {
    name: 'SESSION_SECRET',
    required: true,
    validate: (value) => value.length >= 32,
    description: 'Secret key for session encryption (minimum 32 characters)',
  },

  // Authentication (Replit Auth - if using)
  {
    name: 'REPLIT_DOMAINS',
    required: false,
    description: 'Replit domains for authentication',
  },
  {
    name: 'REPL_ID',
    required: false,
    description: 'Replit application ID',
  },
  {
    name: 'ISSUER_URL',
    required: false,
    description: 'OpenID Connect issuer URL',
  },

  // Payment Providers (Optional but recommended for production)
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    validate: (value) => value.startsWith('sk_'),
    description: 'Stripe secret key (starts with sk_)',
  },
  {
    name: 'STRIPE_PUBLISHABLE_KEY',
    required: false,
    validate: (value) => value.startsWith('pk_'),
    description: 'Stripe publishable key (starts with pk_)',
  },

  // Logging (Optional)
  {
    name: 'LOG_LEVEL',
    required: false,
    validate: (value) => ['error', 'warn', 'info', 'debug'].includes(value),
    description: 'Logging level (error, warn, info, debug)',
  },
];

/**
 * Validate environment variables
 * @throws Error if required variables are missing or invalid
 */
export function validateEnvironment(): void {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  for (const envVar of envVars) {
    const value = process.env[envVar.name];

    // Check if required variable is present
    if (envVar.required && !value) {
      errors.push(`❌ ${envVar.name} is required but not set. ${envVar.description}`);
      continue;
    }

    // Skip validation if not set and not required
    if (!value) {
      if (isProduction && envVar.name.includes('STRIPE')) {
        warnings.push(`⚠️  ${envVar.name} is not set. Payment processing may not work. ${envVar.description}`);
      }
      continue;
    }

    // Validate value if validator is provided
    if (envVar.validate && !envVar.validate(value)) {
      errors.push(`❌ ${envVar.name} has invalid value. ${envVar.description}`);
    }
  }

  // Production-specific checks
  if (isProduction) {
    // Check SESSION_SECRET strength
    const sessionSecret = process.env.SESSION_SECRET;
    if (sessionSecret && sessionSecret.length < 32) {
      errors.push('❌ SESSION_SECRET must be at least 32 characters in production');
    }

    // Warn about development mode secrets
    if (process.env.STRIPE_SECRET_KEY?.includes('test')) {
      warnings.push('⚠️  STRIPE_SECRET_KEY appears to be a test key. Use production keys in production.');
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Environment variable warnings detected:', { warnings });
    warnings.forEach(warning => console.warn(warning));
  }

  // Throw error if there are validation errors
  if (errors.length > 0) {
    const errorMessage = [
      '',
      '═══════════════════════════════════════════════════════════════',
      '  ENVIRONMENT CONFIGURATION ERROR',
      '═══════════════════════════════════════════════════════════════',
      '',
      'The following environment variables are missing or invalid:',
      '',
      ...errors,
      '',
      'Please check your .env file or environment configuration.',
      'See .env.example for reference.',
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
    ].join('\n');

    logger.error('Environment validation failed', new Error(errorMessage));
    throw new Error(errorMessage);
  }

  // Log successful validation
  logger.info('Environment validation passed', {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT || 5000,
    databaseConfigured: !!process.env.DATABASE_URL,
    authConfigured: !!(process.env.REPL_ID && process.env.ISSUER_URL),
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
  });
}

/**
 * Get safe environment info for logging (masks sensitive values)
 */
export function getSafeEnvInfo(): Record<string, any> {
  const safeEnv: Record<string, any> = {};
  const sensitiveKeys = ['SECRET', 'KEY', 'PASSWORD', 'TOKEN', 'PRIVATE'];

  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;

    const isSensitive = sensitiveKeys.some(sensitive => key.includes(sensitive));
    
    if (isSensitive) {
      safeEnv[key] = '***REDACTED***';
    } else if (key === 'DATABASE_URL') {
      // Mask password in database URL
      safeEnv[key] = value.replace(/:[^:@]+@/, ':***@');
    } else {
      safeEnv[key] = value;
    }
  }

  return safeEnv;
}
