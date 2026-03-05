const {
  computeDailyPnl,
  buildDateRange,
  groupFillsByDate,
  groupFundingByDate,
  dateKey,
} = require("../src/utils/pnl");

describe("dateKey", () => {
  it("returns YYYY-MM-DD from timestamp", () => {
    expect(dateKey(1690848000000)).toBe("2023-08-01");
  });
});

describe("buildDateRange", () => {
  it("generates inclusive range of dates", () => {
    const range = buildDateRange("2025-08-01", "2025-08-03");
    expect(range).toEqual(["2025-08-01", "2025-08-02", "2025-08-03"]);
  });

  it("returns single date for same start/end", () => {
    const range = buildDateRange("2025-01-15", "2025-01-15");
    expect(range).toEqual(["2025-01-15"]);
  });
});

describe("groupFillsByDate", () => {
  it("groups fills by UTC date", () => {
    const fills = [
      { time: 1690848000000, closedPnl: "10", fee: "1" },
      { time: 1690848060000, closedPnl: "20", fee: "2" },
      { time: 1690934400000, closedPnl: "5", fee: "0.5" },
    ];
    const grouped = groupFillsByDate(fills);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped["2023-08-01"]).toHaveLength(2);
    expect(grouped["2023-08-02"]).toHaveLength(1);
  });
});

describe("groupFundingByDate", () => {
  it("groups funding events by UTC date", () => {
    const events = [
      { time: 1690848000000, delta: { usdc: "-0.5" } },
      { time: 1690934400000, delta: { usdc: "1.2" } },
    ];
    const grouped = groupFundingByDate(events);
    expect(Object.keys(grouped)).toHaveLength(2);
  });
});

describe("computeDailyPnl", () => {
  const fills = [
    { time: 1690848000000, closedPnl: "120.5", fee: "2.1" },
    { time: 1690934400000, closedPnl: "0", fee: "1.2" },
  ];

  const funding = [
    { time: 1690848000000, delta: { usdc: "-0.5" } },
    { time: 1690934400000, delta: { usdc: "-0.3" } },
  ];

  const positions = {
    marginSummary: { accountValue: "10000" },
  };

  it("calculates daily PnL correctly", () => {
    const { daily, summary } = computeDailyPnl(
      fills,
      funding,
      "2023-08-01",
      "2023-08-02",
      positions
    );

    expect(daily).toHaveLength(2);

    expect(daily[0].date).toBe("2023-08-01");
    expect(daily[0].realized_pnl_usd).toBe(120.5);
    expect(daily[0].fees_usd).toBe(2.1);
    expect(daily[0].funding_usd).toBe(-0.5);
    expect(daily[0].net_pnl_usd).toBe(117.9);

    expect(daily[1].date).toBe("2023-08-02");
    expect(daily[1].realized_pnl_usd).toBe(0);
    expect(daily[1].fees_usd).toBe(1.2);
    expect(daily[1].funding_usd).toBe(-0.3);
    expect(daily[1].net_pnl_usd).toBe(-1.5);

    expect(summary.total_realized_usd).toBe(120.5);
    expect(summary.total_fees_usd).toBe(3.3);
    expect(summary.total_funding_usd).toBe(-0.8);
    expect(summary.net_pnl_usd).toBe(116.4);
  });

  it("returns zeros for days with no activity", () => {
    const { daily } = computeDailyPnl(
      [],
      [],
      "2023-08-01",
      "2023-08-03",
      positions
    );

    expect(daily).toHaveLength(3);
    daily.forEach((d) => {
      expect(d.realized_pnl_usd).toBe(0);
      expect(d.fees_usd).toBe(0);
      expect(d.funding_usd).toBe(0);
      expect(d.net_pnl_usd).toBe(0);
    });
  });
});
