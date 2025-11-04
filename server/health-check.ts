/**
 * Health Check Endpoints
 * 
 * Provides health check endpoints for monitoring and load balancers.
 * These endpoints should be accessible without authentication.
 */

import type { Express, Request, Response } from "express";
import { pool } from "./db";

/**
 * Register health check routes
 */
export function registerHealthChecks(app: Express) {
  /**
   * Basic health check - returns 200 if server is running
   * Used by: Load balancers, uptime monitors
   */
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  /**
   * Liveness probe - checks if application is alive
   * Used by: Kubernetes, container orchestration
   */
  app.get("/health/live", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "alive",
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Readiness probe - checks if application can handle requests
   * Includes database connectivity check
   * Used by: Kubernetes, load balancers
   */
  app.get("/health/ready", async (_req: Request, res: Response) => {
    try {
      // Check database connection
      await pool.query("SELECT 1");
      
      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
        checks: {
          database: "connected",
        },
      });
    } catch (error) {
      res.status(503).json({
        status: "not_ready",
        timestamp: new Date().toISOString(),
        checks: {
          database: "disconnected",
        },
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Detailed health check with system metrics
   * Should be protected in production or rate-limited
   */
  app.get("/health/detailed", async (_req: Request, res: Response) => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    try {
      // Check database connection and get stats
      const dbResult = await pool.query(`
        SELECT 
          count(*) as connection_count,
          max(state) as state
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);
      
      const dbStats = dbResult.rows[0];
      
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        system: {
          uptime: process.uptime(),
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid,
        },
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        database: {
          status: "connected",
          activeConnections: parseInt(dbStats.connection_count),
        },
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
