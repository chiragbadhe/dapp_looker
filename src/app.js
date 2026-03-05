const express = require("express");
const cors = require("cors");
const tokenRoutes = require("./routes/token");
const hyperliquidRoutes = require("./routes/hyperliquid");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "DappLooker — Token Insight & Analytics API",
    version: "1.0.0",
    endpoints: {
      health: {
        method: "GET",
        path: "/health",
        description: "Server health check",
      },
      tokenInsight: {
        method: "POST",
        path: "/api/token/:id/insight",
        description:
          "Get AI-powered market insight for any token (e.g. bitcoin, ethereum, chainlink)",
        example: {
          url: "/api/token/bitcoin/insight",
          body: { vs_currency: "usd", history_days: 30 },
        },
      },
      hyperliquidPnl: {
        method: "GET",
        path: "/api/hyperliquid/:wallet/pnl?start=YYYY-MM-DD&end=YYYY-MM-DD",
        description: "Get daily PnL breakdown for a HyperLiquid wallet",
        example: {
          url: "/api/hyperliquid/0x31ca8395cf837de08b24da3f660e77761dfb974b/pnl?start=2025-03-01&end=2025-03-03",
        },
      },
    },
    docs: "See README.md for full setup & usage instructions",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/token", tokenRoutes);
app.use("/api/hyperliquid", hyperliquidRoutes);

app.use(errorHandler);

module.exports = app;
