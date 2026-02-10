/**
 * Environment Variable Validator
 *
 * Validates that all required environment variables are present and valid
 * before the application starts. This prevents runtime errors due to
 * misconfiguration.
 */

import { z } from "zod";
import { logger } from "./logger";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]),
    PORT: z
      .string()
      .optional()
      .transform((value) => value?.trim())
      .refine(
        (value) => {
          if (!value) return true;
          const port = Number(value);
          return Number.isInteger(port) && port > 0 && port < 65536;
        },
        { message: "PORT must be an integer between 1 and 65535" }
      ),
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required")
      .refine(
        (value) =>
          value.startsWith("postgres://") || value.startsWith("postgresql://"),
        { message: "DATABASE_URL must be a PostgreSQL connection string" }
      ),
    SESSION_SECRET: z
      .string()
      .min(32, "SESSION_SECRET must be at least 32 characters long"),
    REPLIT_DOMAINS: z
      .string()
      .min(1, "REPLIT_DOMAINS must contain at least one hostname")
      .refine(
        (value) =>
          value
            .split(",")
            .map((domain) => domain.trim())
            .every((domain) => domain.length > 0),
        { message: "REPLIT_DOMAINS cannot contain empty values" }
      ),
    REPL_ID: z.string().min(1, "REPL_ID is required"),
    ISSUER_URL: z
      .string()
      .optional()
      .refine(
        (value) => {
          if (!value) return true;
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
        { message: "ISSUER_URL must be a valid URL if provided" }
      ),
    STRIPE_SECRET_KEY: z
      .string()
      .optional()
      .refine(
        (value) => !value || value.startsWith("sk_"),
        { message: "STRIPE_SECRET_KEY must start with sk_" }
      ),
    STRIPE_PUBLISHABLE_KEY: z
      .string()
      .optional()
      .refine(
        (value) => !value || value.startsWith("pk_"),
        { message: "STRIPE_PUBLISHABLE_KEY must start with pk_" }
      ),
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).optional(),
  })
  .passthrough();

type EnvConfig = z.infer<typeof envSchema>;

type Warning = string;

function formatZodErrors(error: z.ZodError<EnvConfig>): string[] {
  return error.errors.map((issue) => {
    const path = issue.path.join(".") || "Environment";
    return `❌ ${path.toUpperCase()}: ${issue.message}`;
  });
}

function normalizeDomains(value: string): string {
  return value
    .split(",")
    .map((domain) => domain.trim())
    .filter((domain) => domain.length > 0)
    .join(",");
}

/**
 * Validate environment variables
 * @throws Error if required variables are missing or invalid
 */
export function validateEnvironment(): EnvConfig {
  const parseResult = envSchema.safeParse(process.env);

  if (!parseResult.success) {
    const errors = formatZodErrors(parseResult.error);

    const errorMessage = [
      "",
      "═══════════════════════════════════════════════════════════════",
      "  ENVIRONMENT CONFIGURATION ERROR",
      "═══════════════════════════════════════════════════════════════",
      "",
      "The following environment variables are missing or invalid:",
      "",
      ...errors,
      "",
      "Please check your .env file or environment configuration.",
      "See .env.example for reference.",
      "",
      "═══════════════════════════════════════════════════════════════",
      "",
    ].join("\n");

    logger.error("Environment validation failed", new Error(errorMessage));
    throw new Error(errorMessage);
  }

  const env = parseResult.data;
  const normalizedDomains = normalizeDomains(env.REPLIT_DOMAINS);
  process.env.REPLIT_DOMAINS = normalizedDomains;
  if (env.ISSUER_URL) {
    process.env.ISSUER_URL = env.ISSUER_URL;
  }

  const warnings: Warning[] = [];
  const isProduction = env.NODE_ENV === "production";

  if (isProduction) {
    if (!env.STRIPE_SECRET_KEY) {
      warnings.push(
        "⚠️  STRIPE_SECRET_KEY is not set. Payment processing may not work."
      );
    }
    if (!env.STRIPE_PUBLISHABLE_KEY) {
      warnings.push(
        "⚠️  STRIPE_PUBLISHABLE_KEY is not set. Payment processing may not work."
      );
    }
    if (env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.includes("test")) {
      warnings.push(
        "⚠️  STRIPE_SECRET_KEY appears to be a test key. Use production keys in production."
      );
    }
  }

  if (warnings.length > 0) {
    logger.warn("Environment variable warnings detected:", { warnings });
    warnings.forEach((warning) => console.warn(warning));
  }

  logger.info("Environment validation passed", {
    nodeEnv: env.NODE_ENV,
    port: env.PORT ?? 5000,
    databaseConfigured: !!env.DATABASE_URL,
    authConfigured: !!(env.REPL_ID && normalizedDomains.length > 0),
    stripeConfigured: !!env.STRIPE_SECRET_KEY,
  });

  return env;
}

/**
 * Get safe environment info for logging (masks sensitive values)
 */
export function getSafeEnvInfo(): Record<string, any> {
  const safeEnv: Record<string, any> = {};
  const sensitiveKeys = ["SECRET", "KEY", "PASSWORD", "TOKEN", "PRIVATE"];

  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;

    const isSensitive = sensitiveKeys.some((sensitive) =>
      key.includes(sensitive)
    );

    if (isSensitive) {
      safeEnv[key] = "***REDACTED***";
    } else if (key === "DATABASE_URL") {
      // Mask password in database URL
      safeEnv[key] = value.replace(/:[^:@]+@/, ":***@");
    } else {
      safeEnv[key] = value;
    }
  }

  return safeEnv;
}
