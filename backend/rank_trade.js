
//rank the trade that we detected using the trader's trusted score, market direction, and category fit

const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

function normalizeText(value) {
  return String(value || "").toLowerCase()
}

function getStrongestCategories(statistics) {
  if (!statistics) return []

  if (Array.isArray(statistics.strongest_categories)) {
    return statistics.strongest_categories
  }

  if (typeof statistics.strongest_categories === "string") {
    try {
      const parsed = JSON.parse(statistics.strongest_categories)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
}

function getMarketText(trade) {
  return [
    trade.category,
    trade.eventCategory,
    trade.marketCategory,
    trade.title,
    trade.slug,
    trade.eventSlug,
    trade.outcome
  ].map(normalizeText).join(" ")
}

function categoryMatchesTrade(category, marketText) {
  const normalizedCategory = normalizeText(category)
  if (!normalizedCategory) return false
  if (marketText.includes(normalizedCategory)) return true

  const aliases = {
    sports: ["nba", "nfl", "mlb", "nhl", "epl", "ufc", "soccer", "basketball", "football", "baseball", "hockey"],
    crypto: ["bitcoin", "btc", "ethereum", "eth", "solana", "sol", "crypto"],
    politics: ["election", "president", "senate", "congress", "trump", "biden", "democrat", "republican"],
    economy: ["fed", "inflation", "cpi", "gdp", "recession", "rate cut", "interest rate"],
    finance: ["stock", "nasdaq", "s&p", "dow", "earnings", "market cap"]
  }

  const categoryAliases = aliases[normalizedCategory] || []
  return categoryAliases.some((alias) => marketText.includes(alias))
}

async function rank_trade(trade, wallet) {  //trade:json object containing trade were copying 

//to be continued 

console.log("rank", trade)

if (!trade || trade.length === 0) {
  return 0
}

const current_trade = trade[0]
const traderWallet = current_trade.proxyWallet || wallet

const { data, error } = await supabase
  .from("traders")
  .select("trusted_score, statistics")
  .eq("wallet_address", traderWallet)
  .single()

if (error) {
  console.log("supabase trusted score error", error)
  return 0
}

const trusted_score = data.trusted_score || 0
const strongestCategories = getStrongestCategories(data.statistics)
const marketText = getMarketText(current_trade)
const tradePrice = Number(current_trade.price) || 0
const tradeSide = normalizeText(current_trade.side)

let score = 0

// Trusted score: max 5
if (trusted_score >= 8) score += 4
else if (trusted_score >= 7) score += 3
else if (trusted_score >= 5) score += 2
else if (trusted_score >= 3) score += 1

// Extra point for elite trusted traders
if (trusted_score >= 9) score += 1

// Trade price confidence: max 3
if (tradeSide === "buy" || tradeSide === "sell") {
  if (tradePrice >= 0.55) score += 3
  else if (tradePrice >= 0.5) score += 2
  else if (tradePrice >= 0.4) score += 1
}

// Category fit: max 2
if (strongestCategories.some((category) => categoryMatchesTrade(category, marketText))) {
  score += 2
}

return score

}

module.exports = { rank_trade }
