import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateEnvironment } from "./env-validator";
import { logger, requestLogger, errorLogger } from "./logger";
import { registerHealthChecks } from "./health-check";
import prodLogger, { httpLoggerMiddleware } from "./production-logger";
import {
  configureHelmet,
  configureRateLimiting,
  configureCORS,
  sanitizeInput,
  errorHandler,
  notFoundHandler,
  validateEnvironment as validateProdEnvironment
} from "./security-middleware";

// Validate environment variables before starting
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Use production validation with stricter requirements
  validateProdEnvironment();
} else {
  // Use development validation
  validateEnvironment();
}

const app = express();

// Trust proxy (required for AWS Load Balancer, Azure App Service, Cloudflare)
// In production, specify exact proxy IPs or use more specific configuration
// For cloud platforms with known proxies, trust level 1 is typically safe
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);

// Security headers (Helmet)
if (isProduction) {
  configureHelmet(app);
}

// CORS configuration
if (isProduction) {
  configureCORS(app);
}

// Request parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Input sanitization
if (isProduction) {
  app.use(sanitizeInput);
}

// Request logging middleware
if (isProduction) {
  app.use(httpLoggerMiddleware);
} else {
  app.use(requestLogger());
}

// Rate limiting (production only, can overwhelm dev logs)
if (isProduction) {
  configureRateLimiting(app);
}

// Register health check endpoints FIRST (no auth required)
registerHealthChecks(app);

(async () => {
  try {
    const server = await registerRoutes(app);

    // 404 handler (must be after all routes)
    app.use(notFoundHandler);

    // Error logging middleware
    if (!isProduction) {
      app.use(errorLogger());
    }

    // Error handling middleware (must be last)
    app.use(isProduction ? errorHandler : (err: any, req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Development mode - show stack traces
      const response: any = {
        error: message,
        correlationId: (req as any).correlationId,
        stack: err.stack,
      };

      res.status(status).json(response);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      const logMessage = {
        port,
        env: process.env.NODE_ENV,
        nodeVersion: process.version,
        security: isProduction ? 'enabled' : 'disabled',
      };
      
      if (isProduction) {
        prodLogger.info('Server started successfully', logMessage);
      } else {
        logger.info('Server started successfully', logMessage);
      }
      
      log(`serving on port ${port}`);
      
      // Signal PM2 that app is ready
      if (process.send) {
        process.send('ready');
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      if (isProduction) {
        prodLogger.info(`${signal} received, closing server gracefully`);
      } else {
        logger.info(`${signal} received, closing server gracefully`);
      }
      
      server.close(() => {
        if (isProduction) {
          prodLogger.info('Server closed');
        } else {
          logger.info('Server closed');
        }
        process.exit(0);
      });
      
      // Force close after 30 seconds
      setTimeout(() => {
        if (isProduction) {
          prodLogger.error('Forced shutdown after timeout');
        } else {
          logger.error('Forced shutdown after timeout');
        }
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    if (isProduction) {
      prodLogger.error('Failed to start server', error as Error);
    } else {
      logger.error('Failed to start server', error as Error);
    }
    process.exit(1);
  }
})();

