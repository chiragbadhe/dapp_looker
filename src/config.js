require("dotenv").config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseUrl: process.env.OPENAI_BASE_URL,
  aiModel: process.env.AI_MODEL || "gpt-4o-mini",

  coingecko: {
    baseUrl: "https://api.coingecko.com/api/v3",
  },

  hyperliquid: {
    baseUrl: "https://api.hyperliquid.xyz",
  },
};
