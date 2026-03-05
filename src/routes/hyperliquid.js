const express = require("express");
const hl = require("../services/hyperliquid");
const { computeDailyPnl, computeAccountValue } = require("../utils/pnl");

const router = express.Router();

const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.get("/:wallet/pnl", async (req, res, next) => {
  try {
    const { wallet } = req.params;
    const { start, end } = req.query;

    if (!ETH_ADDRESS_RE.test(wallet)) {
      return res
        .status(400)
        .json({ error: { message: "Invalid wallet address. Must be a 42-character hex Ethereum address." } });
    }

    if (!start || !end || !DATE_RE.test(start) || !DATE_RE.test(end)) {
      return res
        .status(400)
        .json({ error: { message: "Missing or invalid date params. Use ?start=YYYY-MM-DD&end=YYYY-MM-DD" } });
    }

    const startDate = new Date(`${start}T00:00:00Z`);
    const endDate = new Date(`${end}T23:59:59.999Z`);

    if (isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({ error: { message: "Invalid date values" } });
    }

    if (startDate > endDate) {
      return res.status(400).json({ error: { message: "start date must be before end date" } });
    }

    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    const [fills, fundingEvents, clearinghouse] = await Promise.all([
      hl.getUserFillsByTime(wallet, startMs, endMs),
      hl.getUserFunding(wallet, startMs, endMs),
      hl.getClearinghouseState(wallet),
    ]);

    const { daily, summary } = computeDailyPnl(
      fills,
      fundingEvents,
      start,
      end,
      clearinghouse
    );

    res.json({
      wallet,
      start,
      end,
      daily,
      summary,
      diagnostics: {
        data_source: "hyperliquid_api",
        fills_count: fills.length,
        funding_events_count: fundingEvents.length,
        account_value_usd: computeAccountValue(clearinghouse),
        last_api_call: new Date().toISOString(),
        notes:
          "Realized PnL from closed trades. Unrealized PnL requires historical mark prices not available via API; reported as 0 for historical dates.",
      },
    });
  } catch (err) {
    const status = err.response?.status;
    if (status === 400 || status === 422) {
      return res.status(400).json({
        error: {
          message: "HyperLiquid API error — wallet may be invalid or have no activity",
          details: err.response?.data,
        },
      });
    }
    if (status === 403) {
      return res.status(502).json({
        error: {
          message: "HyperLiquid API rejected the request (403). This may be a rate limit or geo-restriction.",
        },
      });
    }
    next(err);
  }
});

module.exports = router;
