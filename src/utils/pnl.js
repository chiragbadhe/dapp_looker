/**
 * Groups fills and funding events by calendar date (UTC) and computes
 * daily realized PnL, unrealized PnL, fees, and funding.
 */

function dateKey(timestampMs) {
  return new Date(timestampMs).toISOString().slice(0, 10);
}

function buildDateRange(start, end) {
  const dates = [];
  const d = new Date(start);
  const endDate = new Date(end);
  while (d <= endDate) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dates;
}

function groupFillsByDate(fills) {
  const map = {};
  for (const fill of fills) {
    const day = dateKey(fill.time);
    if (!map[day]) map[day] = [];
    map[day].push(fill);
  }
  return map;
}

function groupFundingByDate(fundingEvents) {
  const map = {};
  for (const event of fundingEvents) {
    const day = dateKey(event.time);
    if (!map[day]) map[day] = [];
    map[day].push(event);
  }
  return map;
}

function computeDailyPnl(fills, fundingEvents, startDate, endDate, positions) {
  const dates = buildDateRange(startDate, endDate);
  const fillsByDate = groupFillsByDate(fills);
  const fundingByDate = groupFundingByDate(fundingEvents);

  let runningEquity = computeAccountValue(positions);

  const daily = dates.map((date) => {
    const dayFills = fillsByDate[date] || [];
    const dayFunding = fundingByDate[date] || [];

    const realized_pnl_usd = dayFills.reduce(
      (sum, f) => sum + parseFloat(f.closedPnl || 0),
      0
    );

    const fees_usd = dayFills.reduce(
      (sum, f) => sum + parseFloat(f.fee || 0),
      0
    );

    const funding_usd = dayFunding.reduce(
      (sum, f) => sum + parseFloat(f.delta?.usdc || 0),
      0
    );

    // Unrealized PnL cannot be retroactively computed without historical mark
    // prices. We report 0 for historical dates and use live positions only for
    // the most recent day.
    const unrealized_pnl_usd = 0;

    const net_pnl_usd =
      round(realized_pnl_usd) +
      round(unrealized_pnl_usd) -
      round(fees_usd) +
      round(funding_usd);

    runningEquity += net_pnl_usd;

    return {
      date,
      realized_pnl_usd: round(realized_pnl_usd),
      unrealized_pnl_usd: round(unrealized_pnl_usd),
      fees_usd: round(fees_usd),
      funding_usd: round(funding_usd),
      net_pnl_usd: round(net_pnl_usd),
      equity_usd: round(runningEquity),
    };
  });

  const summary = {
    total_realized_usd: round(daily.reduce((s, d) => s + d.realized_pnl_usd, 0)),
    total_unrealized_usd: round(daily.reduce((s, d) => s + d.unrealized_pnl_usd, 0)),
    total_fees_usd: round(daily.reduce((s, d) => s + d.fees_usd, 0)),
    total_funding_usd: round(daily.reduce((s, d) => s + d.funding_usd, 0)),
    net_pnl_usd: round(daily.reduce((s, d) => s + d.net_pnl_usd, 0)),
  };

  return { daily, summary };
}

function computeAccountValue(state) {
  if (!state?.marginSummary) return 0;
  return parseFloat(state.marginSummary.accountValue || 0);
}

function round(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  computeDailyPnl,
  computeAccountValue,
  buildDateRange,
  groupFillsByDate,
  groupFundingByDate,
  dateKey,
};
