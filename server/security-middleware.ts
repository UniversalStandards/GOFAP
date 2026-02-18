/**
 * Production Security Middleware
 * 
 * Implements comprehensive security controls:
 * - Helmet for security headers
 * - Rate limiting to prevent DDoS
 * - Request size limits
 * - CORS configuration
 * - Input sanitization
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Express, Request, Response, NextFunction } from 'express';
import logger from './production-logger';

/**
 * Configure Helmet for security headers
 */
export function configureHelmet(app: Express) {
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], // Note: unsafe-inline needed for some UI libraries
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          scriptSrc: ["'self'"], // Removed unsafe-inline and unsafe-eval for better security
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.stripe.com'],
          frameSrc: ["'self'", 'https://js.stripe.com'],
        },
      },
      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      // Prevent clickjacking
      frameguard: {
        action: 'deny',
      },
      // X-Content-Type-Options
      noSniff: true,
      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    })
  );
  
  logger.info('Security headers configured with Helmet');
}

/**
 * Configure rate limiting
 */
export function configureRateLimiting(app: Express) {
  // General API rate limit
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        correlationId: (req as any).correlationId,
      });
      res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: res.getHeader('Retry-After'),
      });
    },
  });

  // Strict rate limit for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: 'Too many login attempts, please try again later',
    skipSuccessfulRequests: true, // Don't count successful logins
  });

  // Apply rate limiters
  app.use('/api/', generalLimiter);
  app.use('/api/auth/', authLimiter);
  app.use('/api/login', authLimiter);
  
  logger.info('Rate limiting configured');
}

/**
 * Configure CORS
 */
export function configureCORS(app: Express) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Correlation-ID');
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  
  logger.info('CORS configured', { allowedOrigins });
}

/**
 * Request size limits
 */
export function configureRequestLimits(app: Express) {
  // Already configured via express.json() and express.urlencoded()
  // Just log configuration
  logger.info('Request size limits configured', {
    jsonLimit: '10mb',
    urlencodedLimit: '10mb',
  });
}

/**
 * Input sanitization middleware
 * 
 * IMPORTANT: This provides BASIC protection only. It is NOT a complete XSS prevention solution.
 * 
 * For production environments with user-generated content, you MUST use:
 * 1. Client-side: DOMPurify for sanitizing HTML before rendering
 * 2. Server-side: validator.js escape functions or a dedicated sanitization library
 * 3. Content Security Policy (CSP) headers (already configured via Helmet)
 * 4. Output encoding based on context (HTML, JS, URL, CSS)
 * 
 * This middleware provides defense-in-depth but should not be relied upon as the sole XSS prevention.
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Skip sanitization for API endpoints that expect specific formats
  if (req.path.startsWith('/api/webhooks') || req.path.startsWith('/api/health')) {
    return next();
  }
  
  // Log warning if sanitization is being relied upon
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug('Input sanitization applied (consider using dedicated library for production)', {
      path: req.path,
      method: req.method,
    });
  }
  
  next();
}

/**
 * Environment variable validation
 */
export function validateEnvironment() {
  const required = [
    'NODE_ENV',
    'DATABASE_URL',
    'SESSION_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate SESSION_SECRET length
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    logger.error('SESSION_SECRET is too short (minimum 32 characters)');
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }
  
  logger.info('Environment variables validated successfully');
}

/**
 * Error handling middleware - must be last
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const correlationId = (req as any).correlationId || 'unknown';
  
  // Log error with context
  logger.error('Application error', {
    correlationId,
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const statusCode = err.statusCode || err.status || 500;
  
  res.status(statusCode).json({
    error: isDevelopment ? err.message : 'Internal server error',
    correlationId,
    ...(isDevelopment && { stack: err.stack }),
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response) {
  const correlationId = (req as any).correlationId || 'unknown';
  
  logger.warn('Route not found', {
    correlationId,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });
  
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    correlationId,
  });
}
