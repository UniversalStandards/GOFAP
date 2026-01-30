import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test";
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET ?? "development-session-secret-32-characters";
process.env.REPL_ID = process.env.REPL_ID ?? "test-repl-id";
process.env.REPLIT_DOMAINS = process.env.REPLIT_DOMAINS ?? "localhost";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
