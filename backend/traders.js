//this method is meant to find the statistcs for the traders we are going to copy from. and is going to call scoring_traders method to format data

//going to connect to polymarket analytics mcp server to retrieve data 

const {scoring_traders} = require("./scoring_traders")
require("dotenv").config()

const mcp_url = process.env.POLYMARKET_ANALYTICS_MCP_URL
const auth_token = process.env.POLYMARKET_ANALYTICS_API
const claude_api = process.env.CLAUDE_API_KEY


async function traders(people) {  // people(arrays): the addresses the user themselves want to monitor

    try   {  //update in  the future method(early stages)

    

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": claude_api,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "mcp-client-2025-04-04"  // enable MCP support
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          mcp_servers: [
            {
              type: "url",
              url: mcp_url ,  // your Prediction Market Intelligence MCP endpoint
              name: "prediction_market",
              authorization_token: auth_token
            }
          ],
          messages: [
            {
              role: "user",
              content: `Use this auth token: ${auth_token}
              
              You are analyzing Polymarket traders. I have selected 5 wallets from the top 50 of the Heisenberg Leaderboard ranked by H-Score: ${people}.

For each wallet, call agent_id 569 (Polymarket PnL) with these params:
- wallet: <address>
- granularity: "1m"
- start_time: "2026-01-01"
- end_time: "2026-04-01"

You MUST call agent_id 569 separately for EACH wallet.

Return a JSON array with exactly 5 elements. Each element MUST have exactly these fields:
{
  "wallet": string,
  "win_rate": number,
  "money_won": number,
  "money_lost": number,
  "total_pnl": number
}

Field mapping and calculations:
- "wallet" → proxy_wallet
- "win_rate" → average of all win_rate values across the returned periods
- "money_won" → sum of pnl values where pnl > 0
- "money_lost" → absolute sum of pnl values where pnl < 0
- "total_pnl" → sum of all pnl values

Rules:
- Only use data from the returned periods between 2026-01-01 and 2026-04-01 (last 3 months)
- Include ALL 5 wallets
- Do NOT reorder or omit any wallets
- Do NOT include any additional fields
- Each wallet must produce exactly one object
- Return ONLY raw JSON
- No explanations
- No markdown
- No backticks
- No extra text`
            }
          ]
        })
      });


      const data = await response.json()

    //   console.log("data",data)
      const rawText = data.content[data.content.length - 1].text;
    
      console.log("raw from mcp",rawText)
      const parsed_traders = JSON.parse(rawText);

      const user_scores = scoring_traders(parsed_traders)
      const scored_trader_data = parsed_traders.map((trader, index) => ({
        wallet: trader.wallet,
        score: user_scores[index],
        statistics: {
          win_rate: trader.win_rate,
          money_won: trader.money_won,
          money_lost: trader.money_lost,
          total_pnl: trader.total_pnl
        }
      }))

      console.log("scored_traders",scored_trader_data)

      return scored_trader_data 

    }catch(err) { 
        console.log("error",err)
        return []
    }


}

module.exports = { traders }

// traders([
//   '0xbb50e43f1336ac544b71ec3eec51df35e9e5f7c9',
//   '0x70831c34434486ffb8e33270642604d9c5731937',
//   '0xbdcb293dd41148a20895d0e818c0d96c0756e811',
//   '0x2fbccc3918a358ef674854dbd4bbd89b896ef944',
//   '0x730da7d292794217736d5e4c4653c6cf0473d448'
// ])


module.exports = { traders };

