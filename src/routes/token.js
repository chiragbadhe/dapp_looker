const express = require("express");
const coingecko = require("../services/coingecko");
const ai = require("../services/ai");

const router = express.Router();

router.post("/:id/insight", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vs_currency = "usd", history_days = 30 } = req.body || {};

    const [tokenData, chartData] = await Promise.all([
      coingecko.getTokenData(id),
      coingecko
        .getMarketChart(id, vs_currency, history_days)
        .catch(() => null),
    ]);

    const { insight, model } = await ai.getInsight(tokenData, chartData);

    res.json({
      source: "coingecko",
      token: {
        id: tokenData.id,
        symbol: tokenData.symbol,
        name: tokenData.name,
        market_data: tokenData.market_data,
      },
      insight,
      model,
    });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: { message: `Token '${req.params.id}' not found on CoinGecko` } });
    }
    next(err);
  }
});

module.exports = router;
