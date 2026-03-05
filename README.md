# DappLooker — Token Insight & Analytics API

A Node.js/Express backend that provides two REST APIs:

1. **Token Insight API** — Fetches token market data from CoinGecko, sends it to an AI model, and returns combined market data + AI-generated insight.
2. **HyperLiquid Daily PnL API** — Fetches a wallet's trade fills and funding from HyperLiquid and computes daily profit & loss breakdown.

---

## Quick Start

### Prerequisites

- **Node.js** >= 18
- An **OpenAI API key** (or any OpenAI-compatible endpoint)

### 1. Clone & Install

```bash
git clone <repo-url>
cd dapp_looker
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Server port |
| `OPENAI_API_KEY` | **Yes** | — | OpenAI (or compatible) API key |
| `AI_MODEL` | No | `gpt-4o-mini` | Model name |
| `OPENAI_BASE_URL` | No | — | Override for local/custom AI endpoints |

**Using a local model (e.g. Ollama / llama.cpp):**

```bash
OPENAI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama3
```

### 3. Run

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server starts at `http://localhost:3000`.

---

## Docker

```bash
docker build -t dapplooker-api .
docker run -p 3000:3000 --env-file .env dapplooker-api
```

---

## Screenshots

### Token Insight API (Bitcoin)

![Token Insight API](./insight_ss.png)

### HyperLiquid Daily PnL API

![HyperLiquid PnL API](./hyperliquid_ss.png)

---

## API Reference

### Health Check

```
GET /health
```

Returns `{ "status": "ok", "timestamp": "..." }`.

---

### 1. Token Insight

```
POST /api/token/:id/insight
```

Fetches token data from CoinGecko, generates an AI insight, and returns both.

**Path params:**
- `id` — CoinGecko token ID (e.g. `bitcoin`, `ethereum`, `chainlink`)

**Request body (optional):**

```json
{
  "vs_currency": "usd",
  "history_days": 30
}
```

**Example response:**

```json
{
  "source": "coingecko",
  "token": {
    "id": "chainlink",
    "symbol": "link",
    "name": "Chainlink",
    "market_data": {
      "current_price_usd": 7.23,
      "market_cap_usd": 3500000000,
      "total_volume_usd": 120000000,
      "price_change_percentage_24h": -1.2
    }
  },
  "insight": {
    "summary": "Chainlink shows moderate sideways movement...",
    "reasoning": "Price consolidating near support levels...",
    "sentiment": "Neutral",
    "risk_level": "Medium",
    "key_factors": ["Oracle adoption", "Market correlation", "DeFi TVL trends"]
  },
  "model": {
    "provider": "openai",
    "model": "gpt-4o-mini"
  }
}
```

---

### 2. HyperLiquid Daily PnL

```
GET /api/hyperliquid/:wallet/pnl?start=YYYY-MM-DD&end=YYYY-MM-DD
```

Fetches trade fills and funding from HyperLiquid and computes daily PnL breakdown.

**Path params:**
- `wallet` — Ethereum address (42-char hex, e.g. `0x31ca8395...`)

**Query params:**
- `start` — Start date (YYYY-MM-DD)
- `end` — End date (YYYY-MM-DD)

**Example response:**

```json
{
  "wallet": "0xabc123...",
  "start": "2025-08-01",
  "end": "2025-08-03",
  "daily": [
    {
      "date": "2025-08-01",
      "realized_pnl_usd": 120.5,
      "unrealized_pnl_usd": 0,
      "fees_usd": 2.1,
      "funding_usd": -0.5,
      "net_pnl_usd": 117.9,
      "equity_usd": 10117.9
    }
  ],
  "summary": {
    "total_realized_usd": 120.5,
    "total_unrealized_usd": 0,
    "total_fees_usd": 3.3,
    "total_funding_usd": -0.8,
    "net_pnl_usd": 116.4
  },
  "diagnostics": {
    "data_source": "hyperliquid_api",
    "fills_count": 12,
    "funding_events_count": 6,
    "last_api_call": "2025-09-22T12:00:00Z",
    "notes": "..."
  }
}
```

**Error handling:**
- `400` — Invalid wallet address, missing/invalid dates, start > end
- `404` — Token not found (Token API only)
- `500` — Internal / upstream API errors

---

## Testing

```bash
npm test
```

Runs unit tests for PnL calculation, AI prompt building, and route validation.

---

## Project Structure

```
src/
├── index.js              # Server entry point
├── app.js                # Express app setup
├── config.js             # Environment configuration
├── middleware/
│   └── errorHandler.js   # Global error handler
├── routes/
│   ├── token.js          # POST /api/token/:id/insight
│   └── hyperliquid.js    # GET /api/hyperliquid/:wallet/pnl
├── services/
│   ├── coingecko.js      # CoinGecko API client
│   ├── ai.js             # AI service (OpenAI-compatible)
│   └── hyperliquid.js    # HyperLiquid API client
└── utils/
    └── pnl.js            # PnL calculation logic
tests/
├── pnl.test.js           # PnL utility tests
├── ai.test.js            # AI service tests
└── routes.test.js        # Route integration tests
```

---

## Design Decisions

- **No database required** — all data is fetched from external APIs in real-time.
- **Unrealized PnL** — Historical mark prices are not available via HyperLiquid's public API, so unrealized PnL is reported as 0 for past dates. Current positions are fetched via `clearinghouseState` for diagnostics.
- **AI flexibility** — Supports OpenAI, local models (Ollama, llama.cpp), or any OpenAI-compatible endpoint via `OPENAI_BASE_URL`.
- **Pagination** — HyperLiquid fills are paginated in batches to handle wallets with high activity.

---

## Postman Collection

Import `postman_collection.json` into Postman. Set the `baseUrl` variable (defaults to `http://localhost:3000`).
