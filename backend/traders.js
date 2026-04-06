//this method is meant to find the statistcs for the traders we are going to copy from. and is going to call scoring_traders method to format data

//going to connect to polymarket analytics mcp server to retrieve data 

const {scoring, scoring_traders} = require("./scoring_traders")
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
      const traders = JSON.parse(rawText);

      
      const scored_traders = scoring_traders(traders)

      console.log("scored_traders",scored_traders)

      return scored_traders //going to return json with wallet address and trusted score

    }catch(err) { 
        console.log("error",err)
    }


}

// traders(["0x384a7e595f27e2c1da38e300f3e3aa1be9df4b79", "0x9470ad5f704b311e8470cec193ddb1f3c2d08a30", "0x4c26cb39e509910798502d2013859b6216606f6d", "0x54dbe14d342f129be293df83a12515065b6c0174", "0x436f969d99c90191fbc2c629e6b7a1b754402c7f"])


module.exports = { traders };

