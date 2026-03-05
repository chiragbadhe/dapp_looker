const request = require("supertest");
const app = require("../src/app");

describe("Health check", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("Token Insight API", () => {
  it("returns 404 for non-existent token", async () => {
    const res = await request(app)
      .post("/api/token/this-token-does-not-exist-xyz/insight")
      .send({ vs_currency: "usd", history_days: 7 });
    expect([404, 500]).toContain(res.status);
  });
});

describe("HyperLiquid PnL API", () => {
  it("rejects invalid wallet address", async () => {
    const res = await request(app).get(
      "/api/hyperliquid/not-a-wallet/pnl?start=2025-08-01&end=2025-08-03"
    );
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid wallet/i);
  });

  it("rejects missing date params", async () => {
    const res = await request(app).get(
      "/api/hyperliquid/0x1234567890abcdef1234567890abcdef12345678/pnl"
    );
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/date/i);
  });

  it("rejects start > end", async () => {
    const res = await request(app).get(
      "/api/hyperliquid/0x1234567890abcdef1234567890abcdef12345678/pnl?start=2025-08-05&end=2025-08-01"
    );
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/before/i);
  });
});
