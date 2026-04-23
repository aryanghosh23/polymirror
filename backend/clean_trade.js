//return token id, side, size, and price going to pass as arguments for execute.js 

const { execute } = require("./execute")
const { rank_trade } = require("./rank_trade")
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const COPY_AMOUNT_USDC = 1

function getActivityDate(timestamp) {
  if (!timestamp) return new Date()

  const numericTimestamp = Number(timestamp)
  if (!Number.isFinite(numericTimestamp)) return new Date()

  return new Date(numericTimestamp * 1000)
}

function normalizeSide(side) {
  return String(side || "").toUpperCase()
}

function getOrderSize(item) {
  const side = normalizeSide(item.side)
  const activitySize = Number(item.size)

  if (side === "SELL" && Number.isFinite(activitySize)) {
    return activitySize
  }

  return null
}

function getMarketSnapshot(item) {
  return {
    conditionId: item.conditionId ?? null,
    tokenId: item.asset ?? item.tokenId ?? null,
    outcomeIndex: item.outcomeIndex ?? null,
    outcome: item.outcome ?? null,
    title: item.title ?? null,
    slug: item.slug ?? null,
    eventSlug: item.eventSlug ?? null,
    category: item.category ?? item.eventCategory ?? item.marketCategory ?? null,
    icon: item.icon ?? null,
    transactionHash: item.transactionHash ?? null,
    price: item.price ?? null,
    side: normalizeSide(item.side),
    usdcSize: item.usdcSize ?? null,
    size: item.size ?? null,
    timestamp: item.timestamp ?? null
  }
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase()
}

function getMarketIdentity(record) {
  const market = record.market || {}

  return {
    conditionId: normalizeText(market.conditionId),
    tokenId: normalizeText(market.tokenId),
    slug: normalizeText(market.slug),
    eventSlug: normalizeText(market.eventSlug),
    tradeName: normalizeText(record.trade_name),
    position: normalizeText(record.position)
  }
}

function isSameMarketPosition(a, b) {
  const first = getMarketIdentity(a)
  const second = getMarketIdentity(b)

  if (first.tokenId && second.tokenId) return first.tokenId === second.tokenId

  if (first.conditionId && second.conditionId) {
    return first.conditionId === second.conditionId && first.position === second.position
  }

  if (first.slug && second.slug) {
    return first.slug === second.slug && first.position === second.position
  }

  if (first.eventSlug && second.eventSlug) {
    return first.eventSlug === second.eventSlug && first.position === second.position
  }

  return first.tradeName === second.tradeName && first.position === second.position
}

function isCopiedTrade(record) {
  const decision = normalizeText(record.trade_decision)
  const status = normalizeText(record.status)

  return decision === "copied" || status === "copied" || status === "execute"
}

async function fetchTradesByFilter(applyFilter) {
  let query = supabase
    .from("trades")
    .select("id, trade_name, trade, position, market, status, trade_decision, created_at")

  query = applyFilter(query)

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

async function fetchRelatedTrades(record) {
  const identity = getMarketIdentity(record)
  const relatedTrades = new Map()
  const queries = []

  if (identity.tokenId) {
    queries.push((query) => query.eq("market->>tokenId", identity.tokenId))
  }

  if (identity.conditionId) {
    queries.push((query) =>
      query
        .eq("market->>conditionId", identity.conditionId)
        .eq("position", record.position)
    )
  }

  if (identity.slug) {
    queries.push((query) =>
      query
        .eq("market->>slug", identity.slug)
        .eq("position", record.position)
    )
  }

  if (identity.eventSlug) {
    queries.push((query) =>
      query
        .eq("market->>eventSlug", identity.eventSlug)
        .eq("position", record.position)
    )
  }

  queries.push((query) =>
    query
      .eq("trade_name", record.trade_name)
      .eq("position", record.position)
  )

  for (const applyFilter of queries) {
    const trades = await fetchTradesByFilter(applyFilter)
    for (const trade of trades) {
      relatedTrades.set(trade.id, trade)
    }
  }

  return [...relatedTrades.values()].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )
}

async function isDuplicateTrade(record) {
  let relatedTrades = []

  try {
    relatedTrades = await fetchRelatedTrades(record)
  } catch (error) {
    console.log("supabase duplicate check error", error)
    return { duplicate: true, lastTrade: null }
  }

  const tradesToCompare = isCopiedTrade(record)
    ? relatedTrades.filter(isCopiedTrade)
    : relatedTrades

  const lastRelatedTrade = tradesToCompare.find((existingTrade) =>
    isSameMarketPosition(record, existingTrade)
  )

  if (!lastRelatedTrade) {
    return { duplicate: false, lastTrade: null }
  }

  return {
    duplicate: normalizeSide(lastRelatedTrade.trade) === normalizeSide(record.trade),
    lastTrade: lastRelatedTrade
  }
}

async function Clean_trade(trade, wallet) {
  console.log("clean trade method reached",trade)
  const result = trade
    .filter((trade) => ["BUY", "SELL"].includes(normalizeSide(trade.side)))
    .map((item) => ({
      price: item.price,
      side: normalizeSide(item.side),
      size: getOrderSize(item),
      tokenId: item.asset,
      icon: item.icon,
      title: item.title,
      copy_wallet: item.proxyWallet || wallet,
      position: item.outcome,
      usdcSize: item.usdcSize,
      timestamp: item.timestamp,
      market: getMarketSnapshot(item)
    }))

  if (result.length === 0) {
    console.log("not a buy or sell")
    return
  }

  try {
    const tradeScore = await rank_trade(trade, wallet)  //rank trade using our method 

    console.log("ranking trade",tradeScore )
    const status = tradeScore >= 7 ? "COPIED" : "PASS"
    const outcome = tradeScore >= 7 ? "UNDECIDED" : "PASSED"
    const activityDate = getActivityDate(result[0].timestamp)
    const tradeRecord = {
      user_copy: result[0].copy_wallet,
      trade_name: result[0].title,
      icon: result[0].icon,
      price: result[0].price,
      money_spent: COPY_AMOUNT_USDC,
      trade: result[0].side,
      position: result[0].position,
      trade_score: tradeScore,
      status,
      created_at: activityDate.toISOString(),
      trade_decision: status,
      outcome,
      market: result[0].market

    }

    const { duplicate, lastTrade } = await isDuplicateTrade(tradeRecord)

    if (duplicate) {
      console.log("duplicate trade skipped", {
        trade_name: tradeRecord.trade_name,
        position: tradeRecord.position,
        trade: tradeRecord.trade,
        previous_trade: lastTrade?.trade,
        previous_created_at: lastTrade?.created_at,
        created_at: tradeRecord.created_at
      })
      return
    }

    if (lastTrade) {
      console.log("opposite market action allowed", {
        trade_name: tradeRecord.trade_name,
        position: tradeRecord.position,
        trade: tradeRecord.trade,
        previous_trade: lastTrade.trade,
        previous_created_at: lastTrade.created_at,
        created_at: tradeRecord.created_at
      })
    }

    if (tradeScore >= 7) {
      // await execute(result[0].tokenId, result[0].price, result[0].size, result[0].side)

      console.log("trade was executed")
      //trade was executed
      const { data, error } = await supabase
        .from("trades")
        .insert([tradeRecord])

        //trade was recorded in db

      if (error) {
        console.log("supabase insert error", error)
      }

    } else {
      const { data, error } = await supabase
        .from("trades")
        .insert([tradeRecord])

        console.log("trade was passed instead")

      if (error) {
        console.log("supabase insert error", error)
      }

      console.log("trade failed because score was below 7")
    }
  } catch (err) {
    console.log("err", err)
  }
}



// Clean_trade(
//  [
//   {
//     proxyWallet: '0x64d62f624dff82248a645bb8007f2c8b012c8795',
//     timestamp: 1775417251,
//     conditionId: '0x4c0348dfc0c77e682c30ebccb0d4662933a81356540bc39ef8992a220f1a93d3',
//     type: 'TRADE',
//     size: 1.2425,
//     usdcSize: 1,
//     transactionHash: '0x97b178352aba3ac88bd402edb0f171e2aa0f5f09cde4935cf5af67b54797c528',
//     price: 0.8,
//     asset: '42468362424968849700578753221017831350877530533963822510347586233389497947510',
//     side: 'BUY',
//     outcomeIndex: 1,
//     title: 'Raptors vs. Celtics',
//     slug: 'nba-tor-bos-2026-04-05',
//     icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/super+cool+basketball+in+red+and+blue+wow.png',
//     eventSlug: 'nba-tor-bos-2026-04-05',
//     outcome: 'Celtics',
//     name: '0x64d62f624DFf82248a645BB8007f2C8b012C8795-1773982232999',
//     pseudonym: 'Mature-Burglar',
//     bio: '',
//     profileImage: '',
//     profileImageOptimized: ''
//   }
// ],"0x64d62f624dff82248a645bb8007f2c8b012c8795")

module.exports = {Clean_trade}
