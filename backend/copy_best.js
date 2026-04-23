//this is going to be a direct api endpoint to get top 10 addresses from henseinberg leaderboard

require("dotenv").config()

const HEISENBERG_RETRIEVE_URL = "https://narrative.agent.heisenberg.so/api/v2/semantic/retrieve/parameterized"
const HEISENBERG_AGENT_ID = 579
const LEADERBOARD_LIMIT = 50

function extractLeaderboardRows(data) {
  if (!data) return []

  if (typeof data === "string") {
    try {
      return extractLeaderboardRows(JSON.parse(data))
    } catch {
      return []
    }
  }

  if (Array.isArray(data)) {
    if (data.length === 1 && typeof data[0] === "object") {
      const nestedRows = extractLeaderboardRows(data[0])
      if (nestedRows.length > data.length) return nestedRows
    }

    return data
  }

  const directArrayKeys = [
    "data",
    "results",
    "records",
    "items",
    "rows",
    "leaderboard",
    "users",
    "result",
    "output"
  ]

  for (const key of directArrayKeys) {
    const rows = extractLeaderboardRows(data[key])
    if (rows.length > 0) return rows
  }

  let largestNestedRows = []
  for (const value of Object.values(data)) {
    const rows = extractLeaderboardRows(value)
    if (rows.length > largestNestedRows.length) largestNestedRows = rows
  }

  if (largestNestedRows.length > 0) return largestNestedRows

  if (data.rank || data.proxy_wallet || data.wallet || data.address) {
    return [data]
  }

  return []
}

async function copy_best() {
  const apiKey = process.env.POLYMARKET_ANALYTICS_API
 

  if (!apiKey) {
    console.log("missing api key")
    return []
  }

  try {
    const response = await fetch(HEISENBERG_RETRIEVE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        agent_id: HEISENBERG_AGENT_ID,
        params: {
          window_days: "3"
        },
        pagination: { limit: LEADERBOARD_LIMIT, offset: 0 },
        formatter_config: { format_type: "raw" }
      })
    })

    if (!response.ok) {
      throw new Error(`Heisenberg API HTTP ${response.status}`)
    }

    const data = await response.json()


    const leaderboard = extractLeaderboardRows(data)
    const topUsers = leaderboard.slice(0, LEADERBOARD_LIMIT)

    console.log(`copy_best returned ${topUsers.length} users`)
    topUsers.forEach((user, index) => {
      console.log(`copy_best user ${index + 1}`, user)
    })

    return topUsers
  } catch (err) {
    console.log("error", err)
    return []
  }
}

if (require.main === module) {
  copy_best().then((users) => {
    console.log("copy_best final users", users)
  })
}

module.exports = { copy_best }
