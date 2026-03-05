const OpenAI = require("openai");
const config = require("../config");

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
  ...(config.openaiBaseUrl && { baseURL: config.openaiBaseUrl }),
});

function buildPrompt(tokenData, chartSummary) {
  return `You are a crypto market analyst. Analyze the following token data and provide a brief insight.

Token: ${tokenData.name} (${tokenData.symbol.toUpperCase()})
Current Price (USD): $${tokenData.market_data.current_price_usd}
Market Cap (USD): $${tokenData.market_data.market_cap_usd}
24h Volume (USD): $${tokenData.market_data.total_volume_usd}
24h Price Change: ${tokenData.market_data.price_change_percentage_24h}%
7d Price Change: ${tokenData.market_data.price_change_percentage_7d}%
30d Price Change: ${tokenData.market_data.price_change_percentage_30d}%
ATH (USD): $${tokenData.market_data.ath_usd}
ATL (USD): $${tokenData.market_data.atl_usd}
Circulating Supply: ${tokenData.market_data.circulating_supply}
Total Supply: ${tokenData.market_data.total_supply}
${chartSummary ? `\nRecent price trend (${chartSummary.days}d): Start $${chartSummary.startPrice} → End $${chartSummary.endPrice} (${chartSummary.changePercent}%)` : ""}
${tokenData.description ? `\nDescription: ${tokenData.description}` : ""}

Respond ONLY with valid JSON in this exact format:
{
  "summary": "<2-3 sentence market overview>",
  "reasoning": "<1-2 sentence analysis of price action and fundamentals>",
  "sentiment": "<Bullish|Bearish|Neutral>",
  "risk_level": "<Low|Medium|High>",
  "key_factors": ["<factor1>", "<factor2>", "<factor3>"]
}`;
}

function summarizeChart(chartData) {
  if (!chartData?.prices?.length) return null;

  const prices = chartData.prices;
  const startPrice = prices[0][1];
  const endPrice = prices[prices.length - 1][1];
  const changePercent = (((endPrice - startPrice) / startPrice) * 100).toFixed(
    2
  );
  const days = Math.round(
    (prices[prices.length - 1][0] - prices[0][0]) / (1000 * 60 * 60 * 24)
  );

  return {
    startPrice: startPrice.toFixed(4),
    endPrice: endPrice.toFixed(4),
    changePercent,
    days,
  };
}

async function getInsight(tokenData, chartData) {
  const chartSummary = summarizeChart(chartData);
  const prompt = buildPrompt(tokenData, chartSummary);

  const completion = await openai.chat.completions.create({
    model: config.aiModel,
    messages: [
      {
        role: "system",
        content:
          "You are a crypto analyst. Always respond with valid JSON only, no markdown.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const raw = completion.choices[0]?.message?.content?.trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("AI response was not valid JSON");
    }
  }

  const requiredFields = ["summary", "reasoning", "sentiment"];
  for (const field of requiredFields) {
    if (!parsed[field]) {
      throw new Error(`AI response missing required field: ${field}`);
    }
  }

  return {
    insight: parsed,
    model: {
      provider: config.openaiBaseUrl ? "custom" : "openai",
      model: config.aiModel,
    },
  };
}

module.exports = { getInsight, buildPrompt, summarizeChart };
