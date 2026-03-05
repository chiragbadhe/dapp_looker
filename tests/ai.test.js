const { buildPrompt, summarizeChart } = require("../src/services/ai");

describe("summarizeChart", () => {
  it("summarizes chart data correctly", () => {
    const chart = {
      prices: [
        [1690848000000, 7.0],
        [1690934400000, 7.5],
        [1691020800000, 7.23],
      ],
    };
    const result = summarizeChart(chart);
    expect(result.startPrice).toBe("7.0000");
    expect(result.endPrice).toBe("7.2300");
    expect(parseFloat(result.changePercent)).toBeCloseTo(3.29, 1);
    expect(result.days).toBe(2);
  });

  it("returns null for empty chart", () => {
    expect(summarizeChart(null)).toBeNull();
    expect(summarizeChart({ prices: [] })).toBeNull();
  });
});

describe("buildPrompt", () => {
  it("includes token name and market data", () => {
    const token = {
      name: "Chainlink",
      symbol: "link",
      description: "Decentralized oracle",
      market_data: {
        current_price_usd: 7.23,
        market_cap_usd: 3500000000,
        total_volume_usd: 120000000,
        price_change_percentage_24h: -1.2,
        price_change_percentage_7d: 3.5,
        price_change_percentage_30d: -5.0,
        ath_usd: 52.88,
        atl_usd: 0.148,
        circulating_supply: 517000000,
        total_supply: 1000000000,
      },
    };

    const prompt = buildPrompt(token, null);
    expect(prompt).toContain("Chainlink");
    expect(prompt).toContain("LINK");
    expect(prompt).toContain("7.23");
    expect(prompt).toContain("JSON");
  });
});
