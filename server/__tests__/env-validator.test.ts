import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { validateEnvironment } from "../env-validator";
import { logger } from "../logger";

const baseEnv = { ...process.env };

describe("validateEnvironment", () => {
  beforeEach(() => {
    process.env = {
      ...baseEnv,
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
      SESSION_SECRET: "a".repeat(32),
      REPLIT_DOMAINS: "example.com , sub.example.com",
      REPL_ID: "client-123",
    } as NodeJS.ProcessEnv;

    vi.spyOn(logger, "info").mockImplementation(() => {});
    vi.spyOn(logger, "warn").mockImplementation(() => {});
    vi.spyOn(logger, "error").mockImplementation(() => {});
  });

  it("passes when all required configuration values are present", () => {
    const config = validateEnvironment();

    expect(config.REPL_ID).toBe("client-123");
    expect(process.env.REPLIT_DOMAINS).toBe("example.com,sub.example.com");
  });

  it("throws a descriptive error when required variables are missing", () => {
    delete process.env.REPL_ID;

    expect(() => validateEnvironment()).toThrowError(/REPL_ID/i);
  });

  it("throws when ISSUER_URL is provided with an invalid value", () => {
    process.env.ISSUER_URL = "not-a-valid-url";

    expect(() => validateEnvironment()).toThrowError(/ISSUER_URL/i);
  });

  afterAll(() => {
    process.env = { ...baseEnv } as NodeJS.ProcessEnv;
  });
});
