/**
 * Production-grade Winston Logger Configuration
 * 
 * Provides structured logging with:
 * - JSON format for production
 * - Console format for development
 * - Daily log rotation
 * - Log levels: error, warn, info, http, debug
 * - Correlation IDs for request tracking
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

const logDir = process.env.LOG_DIR || '/tmp/gofaps-logs';
const isDevelopment = process.env.NODE_ENV !== 'production';

// Ensure log directory exists
if (!existsSync(logDir)) {
  try {
    mkdirSync(logDir, { recursive: true });
  } catch (error) {
    console.error(`Failed to create log directory: ${logDir}`, error);
  }
}

// Custom format for development
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// JSON format for production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports based on environment
const transports: winston.transport[] = [];

if (isDevelopment) {
  // Development: Console only
  transports.push(
    new winston.transports.Console({
      format: devFormat,
      level: 'debug',
    })
  );
} else {
  // Production: File rotation + Console for errors
  transports.push(
    // Error logs - kept for 30 days
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: prodFormat,
    }),
    // Combined logs - kept for 14 days
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: prodFormat,
    }),
    // Console for critical errors
    new winston.transports.Console({
      level: 'error',
      format: prodFormat,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format: prodFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Handle uncaught exceptions
if (!isDevelopment) {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
    })
  );

  // Handle unhandled promise rejections
  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
    })
  );
}

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * HTTP request logger middleware
 */
export function httpLoggerMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  const correlationId = req.headers['x-correlation-id'] || req.id || Math.random().toString(36).substring(7);
  
  // Attach correlation ID to request
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Log after response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    };
    
    if (res.statusCode >= 500) {
      logger.error('HTTP Request Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Warning', logData);
    } else if (req.url.startsWith('/health')) {
      // Don't log health checks in production
      if (isDevelopment) {
        logger.debug('HTTP Request', logData);
      }
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
}

export default logger;
