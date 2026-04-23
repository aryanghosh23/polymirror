require("dotenv").config()
const HEISENBERG_RETRIEVE_URL = "https://narrative.agent.heisenberg.so/api/v2/semantic/retrieve/parameterized"
const HEISENBERG_AGENT_ID = 581
const WINDOW_DAYS = "3"
const METRICS_LIMIT = 100

function extractRows(data) {
  if (!data) return []

  if (typeof data === "string") {
    try {
      return extractRows(JSON.parse(data))
    } catch {
      return []
    }
  }

  if (Array.isArray(data)) {
    if (data.length === 1 && typeof data[0] === "object") {
      const nestedRows = extractRows(data[0])
      if (nestedRows.length > data.length) return nestedRows
    }

    return data
  }

  const arrayKeys = [
    "data",
    "results",
    "records",
    "items",
    "rows",
    "metrics",
    "categories",
    "result",
    "output"
  ]

  for (const key of arrayKeys) {
    const rows = extractRows(data[key])
    if (rows.length > 0) return rows
  }

  let largestNestedRows = []
  for (const value of Object.values(data)) {
    const rows = extractRows(value)
    if (rows.length > largestNestedRows.length) largestNestedRows = rows
  }

  if (largestNestedRows.length > 0) return largestNestedRows

  if (typeof data === "object") return [data]

  return []
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0
  if (typeof value === "number") return Number.isFinite(value) ? value : 0

  const parsed = Number(String(value).replace(/[%,$]/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

function roundNumber(value, decimals = 2) {
  const factor = 10 ** decimals
  return Math.round(toNumber(value) * factor) / factor
}

function firstNumber(source, keys) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return toNumber(source[key])
    }
  }

  return 0
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value !== "string") return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeWinRate(value) {
  const rate = toNumber(value)
  if (rate > 1) return rate / 100
  return rate
}

function calculateTradeCount(row, rows) {
  const directTradeCount = firstNumber(row, [
    "trade_count",
    "trades_count",
    "num_trades",
    "number_of_trades",
    "total_trades",
    "markets_traded"
  ])

  if (directTradeCount) return directTradeCount

  return rows.length
}

function calculateMoneyWonLost(row, totalPnl) {
  const directMoneyWon = firstNumber(row, ["money_won", "total_won", "gross_profit", "profits", "winning_pnl"])
  const directMoneyLost = firstNumber(row, ["money_lost", "total_lost", "gross_loss", "losses", "losing_pnl"])

  if (directMoneyWon || directMoneyLost) {
    return {
      money_won: directMoneyWon,
      money_lost: Math.abs(directMoneyLost)
    }
  }

  const profitFactor = firstNumber(row, ["profit_factor"])

  if (profitFactor > 0 && profitFactor !== 1 && totalPnl !== 0) {
    const moneyLost = Math.abs(totalPnl / (profitFactor - 1))
    const moneyWon = profitFactor * moneyLost

    return {
      money_won: moneyWon,
      money_lost: moneyLost
    }
  }

  return {
    money_won: totalPnl > 0 ? totalPnl : 0,
    money_lost: totalPnl < 0 ? Math.abs(totalPnl) : 0
  }
}

function strongestCategories(row) {
  return parseJsonArray(row.performance_by_category)
    .filter((category) => category?.category)
    .sort((a, b) => toNumber(b.total_pnl) - toNumber(a.total_pnl))
    .slice(0, 3)
    .map((category) => category.category)
}

function normalizeMetrics(wallet, rows) {
  const firstRow = rows[0] || {}

  const directWinRate = firstNumber(firstRow, [
    "win_rate",
    "win_rate_pct",
    "win_percentage",
    "win_percentage_pct",
    "winning_percentage",
    "success_rate"
  ])

  const directTotalPnl = firstNumber(firstRow, ["total_pnl", "net_pnl", "pnl", "profit_loss", "realized_pnl"])
  const totalPnl = directTotalPnl
  const { money_won, money_lost } = calculateMoneyWonLost(firstRow, totalPnl)
  const tradeCount = calculateTradeCount(firstRow, rows)
  const directAvgTradePnl = firstNumber(firstRow, [
    "avg_trade_pnl",
    "average_trade_pnl",
    "avg_pnl",
    "average_pnl",
    "pnl_per_trade",
    "mean_trade_pnl"
  ])
  const avgTradePnl = directAvgTradePnl || (tradeCount > 0 ? totalPnl / tradeCount : 0)
  const smallDrawdown = firstNumber(firstRow, [
    "small_drawdown",
    "max_drawdown",
    "maximum_drawdown",
    "drawdown",
    "max_drawdown_pct",
    "drawdown_pct"
  ])

  return {
    wallet,
    small_drawdown: roundNumber(Math.abs(smallDrawdown), 4),
    money_won: roundNumber(money_won),
    money_lost: roundNumber(money_lost),
    win_percentage: roundNumber(normalizeWinRate(directWinRate), 4),
    avg_trade_pnl: roundNumber(avgTradePnl),
    trade_count: roundNumber(tradeCount, 0)
  }
}

async function fetchTraderMetrics(wallet, apiKey) {
  const response = await fetch(HEISENBERG_RETRIEVE_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      agent_id: HEISENBERG_AGENT_ID,
      params: {
        proxy_wallet: wallet,
        window_days: WINDOW_DAYS
      },
      pagination: { limit: METRICS_LIMIT, offset: 0 },
      formatter_config: { format_type: "raw" }
    })
  })

  if (!response.ok) {
    throw new Error(`Heisenberg API HTTP ${response.status} for ${wallet}`)
  }

  const data = await response.json()
  const rows = extractRows(data)
  const metrics = normalizeMetrics(wallet, rows)
  const categories = strongestCategories(rows[0] || {})
  const metricsWithCategories = {
    ...metrics,
    strongest_categories: categories
  }

  console.log("poly_traders user metrics", metricsWithCategories)
  console.log("poly_traders strongest categories", wallet, categories)

  return metricsWithCategories
}

async function poly_traders(wallets) {
  const apiKey = process.env.POLYMARKET_ANALYTICS_API

  
  if (!apiKey) {
    console.log("missing api key")
    return []
  }

  if (!Array.isArray(wallets)) {
    console.log("poly_traders expected an array of wallet addresses")
    return []
  }

  try {
    const uniqueWallets = [...new Set(wallets.filter(Boolean))]
    const traders = await Promise.all(
      uniqueWallets.map(async (wallet) => {
        try {
          return await fetchTraderMetrics(wallet, apiKey)
        } catch (err) {
          console.log("poly_traders wallet error", wallet, err)
          return null
        }
      })
    )
    const validTraders = traders.filter(Boolean)

    console.log(`poly_traders returned ${validTraders.length} users`)
    return validTraders
  } catch (err) {
    console.log("error", err)
    return []
  }
}

module.exports = { poly_traders }
