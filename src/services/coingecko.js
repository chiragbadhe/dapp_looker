const axios = require("axios");
const config = require("../config");

const client = axios.create({
  baseURL: config.coingecko.baseUrl,
  timeout: 15000,
});

async function getTokenData(tokenId) {
  const { data } = await client.get(`/coins/${tokenId}`, {
    params: {
      localization: false,
      tickers: false,
      community_data: false,
      developer_data: false,
      sparkline: false,
    },
  });

  return {
    id: data.id,
    symbol: data.symbol,
    name: data.name,
    description: data.description?.en?.slice(0, 500) || "",
    market_data: {
      current_price_usd: data.market_data?.current_price?.usd ?? null,
      market_cap_usd: data.market_data?.market_cap?.usd ?? null,
      total_volume_usd: data.market_data?.total_volume?.usd ?? null,
      price_change_percentage_24h:
        data.market_data?.price_change_percentage_24h ?? null,
      price_change_percentage_7d:
        data.market_data?.price_change_percentage_7d ?? null,
      price_change_percentage_30d:
        data.market_data?.price_change_percentage_30d ?? null,
      ath_usd: data.market_data?.ath?.usd ?? null,
      atl_usd: data.market_data?.atl?.usd ?? null,
      circulating_supply: data.market_data?.circulating_supply ?? null,
      total_supply: data.market_data?.total_supply ?? null,
    },
  };
}

async function getMarketChart(tokenId, vsCurrency = "usd", days = 30) {
  const { data } = await client.get(`/coins/${tokenId}/market_chart`, {
    params: { vs_currency: vsCurrency, days },
  });

  return {
    prices: data.prices,
    total_volumes: data.total_volumes,
    market_caps: data.market_caps,
  };
}

module.exports = { getTokenData, getMarketChart };
