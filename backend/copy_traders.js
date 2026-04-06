//this method is what addresses we are going to copy from: idea is the user can choose addressses they themsevles want to copy, 
// and we will fill in the rest of the users oursevles


//this method is meant to find the statistcs for the traders we are going to copy from. and is going to call scoring_traders method to format data

//going to connect to polymarket analytics mcp server to retrieve data 

require("dotenv").config()

const mcp_url = process.env.POLYMARKET_ANALYTICS_MCP_URL
const auth_token = process.env.POLYMARKET_ANALYTICS_API
const claude_api = process.env.CLAUDE_API_KEY

async function copy_traders() { 

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

              You are retrieving traders from the Heisenberg Leaderboard.

Call the appropriate agent to fetch the Heisenberg Leaderboard ranked by win percentage.

From the response:

Select the  5 traders in the top 300 by win percentage
Extract their wallet addresses

Rules:

Preserve the exact ranking order (highest win percentage → lowest among the 5)
Do NOT include any additional fields or data
Do NOT reorder or skip any of the top 5
Each wallet must be a string

Output format:

Return a JSON array of exactly 5 wallet address strings
Return ONLY raw JSON
No explanations
No markdown
No backticks
No extra text          

`
            }
          ]
        })
      });


      const data = await response.json()

    //   console.log("data",data)
      const rawText = data.content[data.content.length - 1].text;
    
      console.log("raw from mcp",rawText)
      const traders = JSON.parse(rawText);

      return traders

    }catch(err) { 
        console.log("error",err)
    }


}

// copy_traders()

module.exports = { copy_traders};
