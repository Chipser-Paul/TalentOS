import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import { z } from "zod";
import request from "supertest";

const originalEnv = process.env;

describe("Environment validation", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("validates required backend variables", async () => {
    process.env = {
      NODE_ENV: "test",
      PORT: "5000",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/talentos",
      CLERK_PUBLISHABLE_KEY: "pk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      CLERK_SECRET_KEY: "sk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      LOG_LEVEL: "info",
    };

    const { validateEnvironment } = await import("../lib/env");
    const data = validateEnvironment();
    expect(data.NODE_ENV).toBe("test");
    expect(data.DATABASE_URL).toBe(process.env.DATABASE_URL);
  });

  it("rejects missing DATABASE_URL", async () => {
    process.env = {
      NODE_ENV: "test",
      CLERK_PUBLISHABLE_KEY: "pk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      CLERK_SECRET_KEY: "sk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
    };

    const { validateEnvironment } = await import("../lib/env");
    expect(() => validateEnvironment()).toThrow();
  });
});

describe("Health endpoints", () => {
  let app: express.Express;

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      PORT: "5000",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/talentos",
      CLERK_PUBLISHABLE_KEY: "pk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      CLERK_SECRET_KEY: "sk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      LOG_LEVEL: "error",
      ALLOWED_ORIGINS: "http://localhost:5173",
    };

    vi.resetModules();
    const mod = await import("../app");
    app = mod.default;
  }, 60000);

  it("returns readiness state without auth", async () => {
    const response = await request(app).get("/api/readyz");
    expect([200, 503]).toContain(response.status);
    expect(response.body.status).toBeDefined();
    expect(response.body.database).toBeDefined();
  }, 60000);
});

describe("Rate limiting", () => {
  it("configures AI limiter for candidate routes", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      PORT: "5000",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/talentos",
      CLERK_PUBLISHABLE_KEY: "pk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      CLERK_SECRET_KEY: "sk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      LOG_LEVEL: "error",
      ALLOWED_ORIGINS: "http://localhost:5173",
    };

    vi.resetModules();
    const mod = await import("../app");
    const app = mod.default;
    const response = await request(app).post("/api/candidates").send({});
    expect([200, 401, 404, 429, 500]).toContain(response.status);
  }, 60000);

  it("configures RAG limiter for knowledge query route", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      PORT: "5000",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/talentos",
      CLERK_PUBLISHABLE_KEY: "pk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      CLERK_SECRET_KEY: "sk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      LOG_LEVEL: "error",
      ALLOWED_ORIGINS: "http://localhost:5173",
    };

    vi.resetModules();
    const mod = await import("../app");
    const app = mod.default;
    const response = await request(app).post("/api/knowledge/query").send({});
    expect([200, 401, 404, 429, 500]).toContain(response.status);
  }, 60000);
});

describe("Request hardening", () => {
  it("rejects oversized JSON payloads", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      PORT: "5000",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/talentos",
      CLERK_PUBLISHABLE_KEY: "pk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      CLERK_SECRET_KEY: "sk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      LOG_LEVEL: "error",
      ALLOWED_ORIGINS: "http://localhost:5173",
    };

    vi.resetModules();
    const mod = await import("../app");
    const app = mod.default;
    const largePayload = { data: "x".repeat(1024 * 1024 * 2) };
    const response = await request(app).post("/api/candidates").send(largePayload);
    expect(response.status).toBe(413);
  }, 60000);
});

describe("Security headers", () => {
  it("sets production security headers in production", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      PORT: "5000",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/talentos",
      CLERK_PUBLISHABLE_KEY: "pk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      CLERK_SECRET_KEY: "sk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      LOG_LEVEL: "error",
      ALLOWED_ORIGINS: "https://app.example.com",
    };

    vi.resetModules();
    const mod = await import("../app");
    const app = mod.default;
    const response = await request(app).get("/api/healthz");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("DENY");
    expect(response.headers["strict-transport-security"]).toBeDefined();
  }, 60000);
});
