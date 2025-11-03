/**
 * Structured Logging Configuration
 * 
 * Provides structured logging for production environments.
 * Uses JSON format for easy parsing by log aggregation tools.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
  correlationId?: string;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private isDevelopment: boolean;
  private minLevel: LogLevel;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || (this.isDevelopment ? 'debug' : 'info');
  }

  private levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] <= this.levels[this.minLevel];
  }

  private formatLog(level: LogLevel, message: string, meta?: Record<string, any>, error?: Error): string {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (meta) {
      logEntry.meta = meta;
    }

    if (error) {
      logEntry.error = {
        message: error.message,
        code: (error as any).code,
      };
      
      // Include stack trace in development or for errors
      if (this.isDevelopment || level === 'error') {
        logEntry.error.stack = error.stack;
      }
    }

    // In development, use pretty printing; in production, use single-line JSON
    if (this.isDevelopment) {
      return JSON.stringify(logEntry, null, 2);
    }
    
    return JSON.stringify(logEntry);
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, any>): void {
    if (!this.shouldLog('error')) return;
    
    const err = error instanceof Error ? error : undefined;
    console.error(this.formatLog('error', message, meta, err));
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatLog('warn', message, meta));
  }

  info(message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog('info')) return;
    console.log(this.formatLog('info', message, meta));
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog('debug')) return;
    console.log(this.formatLog('debug', message, meta));
  }

  /**
   * Log HTTP request
   */
  http(method: string, path: string, statusCode: number, duration: number, meta?: Record<string, any>): void {
    if (!this.shouldLog('info')) return;
    
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.log(level, `${method} ${path} ${statusCode}`, {
      ...meta,
      method,
      path,
      statusCode,
      duration,
    });
  }

  /**
   * Generic log method
   */
  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;
    
    const output = this.formatLog(level, message, meta);
    
    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Express middleware for request logging with correlation IDs
 */
export function requestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    // Generate or extract correlation ID
    const correlationId = req.headers['x-correlation-id'] || 
                          req.headers['x-request-id'] || 
                          `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Attach to request for use in handlers
    req.correlationId = correlationId;
    
    // Set response header
    res.setHeader('X-Correlation-ID', correlationId);

    // Log after response finishes
    res.on('finish', () => {
      const duration = Date.now() - start;
      const path = req.path;
      
      // Skip health check logging in production to reduce noise
      if (path.startsWith('/health') && process.env.NODE_ENV === 'production') {
        return;
      }
      
      logger.http(req.method, path, res.statusCode, duration, {
        correlationId,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
    });

    next();
  };
}

/**
 * Express error logging middleware
 */
export function errorLogger() {
  return (err: any, req: any, res: any, next: any) => {
    logger.error(
      `Error handling ${req.method} ${req.path}`,
      err,
      {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        ip: req.ip,
      }
    );
    next(err);
  };
}

/**
 * Uncaught exception handler
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', error, { fatal: true });
  process.exit(1);
});

/**
 * Unhandled rejection handler
 */
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', reason instanceof Error ? reason : new Error(String(reason)));
});

/**
 * Graceful shutdown handler
 */
function handleShutdown(signal: string) {
  logger.info(`Received ${signal}, starting graceful shutdown`);
  
  // Give time for connections to close
  setTimeout(() => {
    logger.info('Graceful shutdown completed');
    process.exit(0);
  }, 5000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
