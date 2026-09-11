import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  getUser: vi.fn(),
  getCardsByHolder: vi.fn(),
  getEnhancedTransactions: vi.fn(),
  getCitizenServices: vi.fn(),
  getPaymentProviders: vi.fn(),
  getIssuedCard: vi.fn(),
  updateIssuedCard: vi.fn(),
}));

vi.mock("../enhanced-storage", () => ({ enhancedStorage: storage }));
vi.mock("../services/service-registry", () => ({
  serviceRegistry: { getService: vi.fn(), healthCheck: vi.fn() },
}));
vi.mock("../services/employee-verification", () => ({
  employeeVerificationService: {},
}));
vi.mock("../routes/bulk-operations", async () => {
  const { Router } = await import("express");
  return { default: Router() };
});
vi.mock("../replitAuth", () => ({
  isAuthenticated: (req: any, res: any, next: any) => {
    const userId = req.header("x-test-user");
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    req.user = { claims: { sub: userId } };
    return next();
  },
}));

import { registerEnhancedRoutes } from "../enhanced-routes";

function createApp() {
  const app = express();
  app.use(express.json());
  registerEnhancedRoutes(app);
  return app;
}

describe("enhanced route data retrieval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.getUser.mockResolvedValue({ id: "employee-1", organizationId: "org-1", role: "user" });
    storage.getCardsByHolder.mockResolvedValue([]);
    storage.getEnhancedTransactions.mockResolvedValue([]);
    storage.getCitizenServices.mockResolvedValue([]);
    storage.getPaymentProviders.mockResolvedValue([]);
  });

  it("calculates an employee spending summary from persisted cards and transactions", async () => {
    storage.getCardsByHolder.mockResolvedValue([
      { id: "card-1", monthlyLimit: "5000.00", spendingLimit: null },
    ]);
    storage.getEnhancedTransactions.mockResolvedValue([
      { amount: "2450.00", status: "completed", createdAt: new Date(), metadata: { cardId: "card-1" } },
      { amount: "125.50", status: "pending", createdAt: new Date(), metadata: { holderId: "employee-1" } },
      { amount: "999.00", status: "completed", createdAt: new Date(), metadata: { holderId: "someone-else" } },
    ]);

    const response = await request(createApp())
      .get("/api/employee/spending-summary")
      .set("x-test-user", "employee-1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      currentMonth: "2450.00",
      monthlyLimit: "5000.00",
      available: "2424.50",
      pending: "125.50",
    });
  });

  it("returns a zero-valued spending summary for an empty account", async () => {
    const response = await request(createApp())
      .get("/api/employee/spending-summary")
      .set("x-test-user", "employee-1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      currentMonth: "0.00", monthlyLimit: "0.00", available: "0.00", pending: "0.00",
    });
  });

  it("requires authorization for employee spending data", async () => {
    const response = await request(createApp()).get("/api/employee/spending-summary");
    expect(response.status).toBe(401);
    expect(storage.getUser).not.toHaveBeenCalled();
  });

  it("returns a typed server failure when spending storage fails", async () => {
    storage.getCardsByHolder.mockRejectedValue(new Error("database unavailable"));
    const response = await request(createApp())
      .get("/api/employee/spending-summary")
      .set("x-test-user", "employee-1");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Failed to fetch spending summary" });
  });

  it("loads and de-duplicates the public service catalog from storage", async () => {
    storage.getCitizenServices.mockResolvedValue([
      { id: "service-1", serviceName: "Property Tax", serviceType: "tax", notes: "Pay property tax" },
      { id: "service-2", serviceName: "Property Tax", serviceType: "tax", notes: "Second payment" },
      { id: "service-3", serviceName: "Water", serviceType: "utility", notes: null },
    ]);
    const response = await request(createApp()).get("/api/public/services");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: "service-2", name: "Property Tax", category: "tax", description: "Second payment" },
      { id: "service-3", name: "Water", category: "utility", description: "" },
    ]);
  });

  it("returns an empty public service catalog when storage has no records", async () => {
    const response = await request(createApp()).get("/api/public/services");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("loads configured payment providers and preserves empty states", async () => {
    storage.getPaymentProviders.mockResolvedValue([
      { id: "provider-1", provider: "stripe", isActive: true, features: ["card", "ach"] },
    ]);
    const populated = await request(createApp())
      .get("/api/payment-providers")
      .set("x-test-user", "employee-1");
    expect(populated.status).toBe(200);
    expect(populated.body).toEqual([
      { id: "provider-1", name: "stripe", status: "active", methods: ["card", "ach"] },
    ]);

    storage.getPaymentProviders.mockResolvedValue([]);
    const empty = await request(createApp())
      .get("/api/payment-providers")
      .set("x-test-user", "employee-1");
    expect(empty.status).toBe(200);
    expect(empty.body).toEqual([]);
  });

  it("rejects an invalid employee card action before accessing storage", async () => {
    const response = await request(createApp())
      .patch("/api/employee/cards/card-1/delete")
      .set("x-test-user", "employee-1");
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid request");
    expect(storage.getIssuedCard).not.toHaveBeenCalled();
  });
});
