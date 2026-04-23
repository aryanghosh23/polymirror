//address that were going to be monitoring, if change in polymarket blockchain was detected, look for the address that the change came from 
//need another method to validate if its coming from polymarket or not 

const detectedTrades = new Set()
const MAX_DETECTED_TRADES = 1000

function getTradeKey(activity) {
  return activity?.transactionHash || activity?.hash || activity?.name
}

function rememberTrade(tradeKey) {
  detectedTrades.add(tradeKey)

  if (detectedTrades.size > MAX_DETECTED_TRADES) {
    detectedTrades.delete(detectedTrades.values().next().value)
  }
}

function getMostRecentTrade(activities, threshold, expectedTransactionHash) {
  const expectedHash = expectedTransactionHash?.toLowerCase()

  return activities
    .filter((item) => {
      const timestampMs = Number(item.timestamp) * 1000
      const tradeKey = getTradeKey(item)
      const tradeHash = tradeKey?.toLowerCase()

      if (!Number.isFinite(timestampMs) || timestampMs < threshold) return false
      if (item.type && item.type !== "TRADE") return false
      if (tradeKey && detectedTrades.has(tradeKey)) return false

      return !expectedHash || tradeHash === expectedHash
    })
    .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))[0]
}

async function monitor(address, expectedTransactionHash) {
    if (!address) return


    const pollStart = Date.now()
    const TIMEOUT = 1 * 60 * 1000 // 1 minutes
    const threshold = pollStart - (1 * 60 * 1000) //pollstart - 1 minutes cause of potential delays
  
    while (Date.now() - pollStart < TIMEOUT) {
      try {
        const response = await fetch(
          `https://data-api.polymarket.com/activity?user=${address}`
        )
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
  
        const data = await response.json()

        const newActivity = getMostRecentTrade(data, threshold, expectedTransactionHash)
  
        if (newActivity) {
          const tradeKey = getTradeKey(newActivity)
          if (tradeKey) {
            rememberTrade(tradeKey)
          }

          console.log("NEW DATA:", newActivity) //new data from the user such as their most recent trade
          return [newActivity]
        }
  
        console.log("no new data yet...")
      } catch (err) {
        console.log("error", err)
      }
  
      await new Promise(res => setTimeout(res, 10000)) // 10 sec delay
    }
  
    return {
      success: false,
      message: "No new data found" //not relevant data 
    }
  }
  
  module.exports = { monitor }
