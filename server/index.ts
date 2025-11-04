import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateEnvironment } from "./env-validator";
import { logger, requestLogger, errorLogger } from "./logger";
import { registerHealthChecks } from "./health-check";

// Validate environment variables before starting
validateEnvironment();

const app = express();

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Trust proxy (required for AWS Load Balancer)
app.set('trust proxy', 1);

// Request logging middleware
app.use(requestLogger());

// Register health check endpoints FIRST (no auth required)
registerHealthChecks(app);

(async () => {
  try {
    const server = await registerRoutes(app);

    // Error logging middleware
    app.use(errorLogger());

    // Error handling middleware (must be last)
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Don't expose stack traces in production
      const response: any = {
        error: message,
        correlationId: (req as any).correlationId,
      };

      if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
      }

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
      logger.info(`Server started successfully`, {
        port,
        env: process.env.NODE_ENV,
        nodeVersion: process.version,
      });
      log(`serving on port ${port}`);
      
      // Signal PM2 that app is ready
      if (process.send) {
        process.send('ready');
      }
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
})();
