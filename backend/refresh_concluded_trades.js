const GAMMA_API_BASE = "https://gamma-api.polymarket.com"
const CLOB_API_BASE = "https://clob.polymarket.com"
const WIN_PRICE_THRESHOLD = 0.99

function normalizeText(value) {
  return String(value || "").trim().toLowerCase()
}

function parseJsonList(value) {
  if (Array.isArray(value)) return value
  if (typeof value !== "string" || value.trim() === "") return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean)
  }
}

async function fetchJson(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`)
  }

  return response.json()
}

function getTradeMarket(trade) {
  return trade.market && typeof trade.market === "object" ? trade.market : {}
}

function findMarketInEvent(event, trade) {
  const markets = Array.isArray(event?.markets) ? event.markets : []
  const tradeMarket = getTradeMarket(trade)
  const tokenId = normalizeText(tradeMarket.tokenId)
  const conditionId = normalizeText(tradeMarket.conditionId)
  const position = normalizeText(trade.position || tradeMarket.outcome)

  return markets.find((market) => {
    const marketTokenIds = parseJsonList(market.clobTokenIds).map(normalizeText)
    const marketOutcomes = parseJsonList(market.outcomes).map(normalizeText)

    if (conditionId && normalizeText(market.conditionId) === conditionId) return true
    if (tokenId && marketTokenIds.includes(tokenId)) return true
    return position && marketOutcomes.includes(position)
  })
}

async function fetchMarketByConditionId(conditionId) {
  const query = encodeURIComponent(conditionId)
  const urls = [
    `${GAMMA_API_BASE}/markets?condition_ids=${query}`,
    `${GAMMA_API_BASE}/markets?condition_id=${query}`,
  ]

  for (const url of urls) {
    let data

    try {
      data = await fetchJson(url)
    } catch {
      continue
    }

    const markets = Array.isArray(data) ? data : data?.data
    const market = Array.isArray(markets)
      ? markets.find((item) => normalizeText(item.conditionId) === normalizeText(conditionId))
      : null

    if (market) return market
  }

  return null
}

async function fetchMarketForTrade(trade) {
  const market = getTradeMarket(trade)

  if (market.slug) {
    try {
      return await fetchJson(`${GAMMA_API_BASE}/markets/slug/${encodeURIComponent(market.slug)}`)
    } catch {
      console.log("market slug lookup failed", market.slug)
    }
  }

  if (market.conditionId) {
    const gammaMarket = await fetchMarketByConditionId(market.conditionId)
    if (gammaMarket) return gammaMarket
  }

  if (market.tokenId) {
    try {
      const tokenMarket = await fetchJson(`${CLOB_API_BASE}/markets-by-token/${encodeURIComponent(market.tokenId)}`)
      if (tokenMarket?.condition_id) {
        const gammaMarket = await fetchMarketByConditionId(tokenMarket.condition_id)
        if (gammaMarket) return gammaMarket
      }
    } catch {
      console.log("market token lookup failed", market.tokenId)
    }
  }

  if (market.eventSlug) {
    try {
      const event = await fetchJson(`${GAMMA_API_BASE}/events/slug/${encodeURIComponent(market.eventSlug)}`)
      return findMarketInEvent(event, trade)
    } catch {
      console.log("event slug lookup failed", market.eventSlug)
    }
  }

  return null
}

function getWinningOutcome(market) {
  const outcomes = parseJsonList(market?.outcomes)
  const outcomePrices = parseJsonList(market?.outcomePrices).map(Number)
  const clobTokenIds = parseJsonList(market?.clobTokenIds)

  if (market?.closed !== true || outcomes.length === 0 || outcomePrices.length === 0) {
    return null
  }

  const winningIndex = outcomePrices.findIndex((price) => Number.isFinite(price) && price >= WIN_PRICE_THRESHOLD)

  if (winningIndex === -1) {
    return null
  }

  return {
    index: winningIndex,
    outcome: outcomes[winningIndex],
    tokenId: clobTokenIds[winningIndex] || null,
    price: outcomePrices[winningIndex],
  }
}

function didTradeWin(trade, winningOutcome) {
  const market = getTradeMarket(trade)
  const tradeTokenId = normalizeText(market.tokenId)
  const tradePosition = normalizeText(trade.position || market.outcome)

  if (tradeTokenId && winningOutcome.tokenId) {
    return tradeTokenId === normalizeText(winningOutcome.tokenId)
  }

  return tradePosition !== "" && tradePosition === normalizeText(winningOutcome.outcome)
}

async function updateTradeOutcome(supabase, trade, outcome, winningOutcome) {
  const existingMarket = getTradeMarket(trade)
  const nextMarket = {
    ...existingMarket,
    resolvedOutcome: winningOutcome.outcome,
    resolvedOutcomeIndex: winningOutcome.index,
    resolvedTokenId: winningOutcome.tokenId,
    resolvedPrice: winningOutcome.price,
  }

  const { error } = await supabase
    .from("trades")
    .update({
      outcome,
      status: "CLOSED",
      market: nextMarket,
    })
    .eq("id", trade.id)

  if (error) throw error
}

async function refreshConcludedTrades(supabase, options = {}) {
  const limit = Number(options.limit) || 50
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .or("outcome.is.null,outcome.eq.UNDECIDED,outcome.eq.undecided,outcome.eq.Undecided")
    .or("status.eq.COPIED,status.eq.copied,status.eq.EXECUTE,status.eq.execute,trade_decision.eq.COPIED,trade_decision.eq.copied")
    .order("created_at", { ascending: true })
    .limit(limit)

  if (error) throw error

  const trades = data || []
  const results = {
    checked: trades.length,
    updated: 0,
    stillOpen: 0,
    skipped: 0,
    errors: [],
  }

  for (const trade of trades) {
    try {
      const market = await fetchMarketForTrade(trade)

      if (!market) {
        results.skipped += 1
        results.errors.push({ tradeId: trade.id, error: "Market not found" })
        continue
      }

      const winningOutcome = getWinningOutcome(market)

      if (!winningOutcome) {
        results.stillOpen += 1
        continue
      }

      const outcome = didTradeWin(trade, winningOutcome) ? "WON" : "LOSS"
      await updateTradeOutcome(supabase, trade, outcome, winningOutcome)
      results.updated += 1
    } catch (error) {
      results.skipped += 1
      results.errors.push({ tradeId: trade.id, error: error.message })
    }
  }

  return results
}

module.exports = { refreshConcludedTrades }
