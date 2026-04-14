
//rank the trade that we detected using metrics like user trusted score where the market is headed, to give a final score where the score should be executed or not

const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function rank_trade(trade) {  //trade:json object containing trade were copying 

//to be continued 

console.log("rank", trade)

if (!trade || trade.length === 0) {
  return 0
}

const current_trade = trade[0]

const { data, error } = await supabase
  .from("traders")
  .select("trusted_score")
  .eq("wallet_address", current_trade.proxyWallet)
  .single()

if (error) {
  console.log("supabase trusted score error", error)
  return 0
}

const trusted_score = data.trusted_score || 0

let score = 0

// trusted score
if (trusted_score >= 8) score += 4
else if (trusted_score >= 7) score += 3
else if (trusted_score >= 5) score += 2
else if (trusted_score >= 3) score += 1

// where the market is headed (still positive)
if (current_trade.side === "BUY") {
  if (current_trade.price >= 0.7) score += 3
  else if (current_trade.price >= 0.55) score += 2
  else if (current_trade.price >= 0.5) score += 1
}

// big trade = more risk → subtract score
if (current_trade.usdcSize >= 1000) score -= 3
else if (current_trade.usdcSize >= 250) score -= 2
else if (current_trade.usdcSize >= 50) score -= 1

return score

}

module.exports = { rank_trade }