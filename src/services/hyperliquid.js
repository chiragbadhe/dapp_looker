const axios = require("axios");
const config = require("../config");

const client = axios.create({
  baseURL: config.hyperliquid.baseUrl,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

function post(body) {
  return client.post("/info", body).then((r) => r.data);
}

async function getUserFillsByTime(wallet, startTime, endTime) {
  const fills = [];
  const BATCH_LIMIT = 2000;
  let cursor = startTime;

  while (cursor < endTime) {
    const batch = await post({
      type: "userFillsByTime",
      user: wallet,
      startTime: cursor,
      endTime,
      aggregateByTime: true,
    });

    if (!batch.length) break;
    fills.push(...batch);

    if (batch.length < BATCH_LIMIT) break;
    cursor = batch[batch.length - 1].time + 1;
  }

  return fills;
}

async function getUserFunding(wallet, startTime, endTime) {
  return post({
    type: "userFunding",
    user: wallet,
    startTime,
    endTime,
  });
}

async function getClearinghouseState(wallet) {
  return post({
    type: "clearinghouseState",
    user: wallet,
  });
}

module.exports = { getUserFillsByTime, getUserFunding, getClearinghouseState };
