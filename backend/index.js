//main file were copy trading bot will perform trading
const express = require("express");
const {monitor} = require('./user_info')
const {traders} = require('./traders')
const {createClient} = require("@supabase/supabase-js")

const {clean_trade} = require("./clean_trade")

const {scoring_traders} = require('./scoring_traders') //remove later
const{copy_traders} = require("./copy_traders")
const cors = require("cors")
const app = express();
app.use(cors())
const PORT = 8000;

require("dotenv").config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

app.use(express.json());

//main endpoint where alchemy hits our bot
app.post("/webhook", (req, res) => { 
    console.log("route reached")
 
    const body = req.body
    const activities = body?.event?.activity || []
    
    // dummy allowed addresses
    const VALID_ADDRESSES = [
      "0x1111111111111111111111111111111111111111",
      "0x64d62f624dff82248a645bb8007f2c8b012c8795",
      "0x000000" 
    ]
    
    let userAddress = null
    
    for (let act of activities) {   //validate address
console.log("address",act.fromAddress)

        if (VALID_ADDRESSES.includes(act.fromAddress)) {
            userAddress = act.fromAddress
            break
            }
      }
  
      if (!userAddress) {
        return res.json({
          success: false,
          message: "Invalid or unknown address"
        })
      }
      
      // if valid


      console.log("userAddress",userAddress)

      const trade = monitor(userAddress)

      
      clean_trade(trade)
      
      return res.status(200).json({
        success: true,
        address: userAddress
      })
  })



  app.get("/trades", async(req,res) => { 

    try { 
const {data,error} = await supabase
.from("trades")
.select("*")

if(error) throw error;

const trades = [...data].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,4)

res.json(trades)

    }catch(err) { 
      res.json(err)
    }


  })



//this endpoint will refresh with new traders maybe every week, 2 days depends on user input
app.get('/new_traders', async (req, res) => {
    console.log("route reached");
  
    //remove later(replace with traders method)

    const addresses = await copy_traders(["0x64d62f624dff82248a645bb8007f2c8b012c8795"],3)
    console.log("address",addresses)
    const users =  await traders(addresses)
  console.log("users",users)


    const rows = users.map(user => ({
      wallet_address: user.wallet_address,
      trusted_score: user.trusted_score,   
      still_monitoring: user.still_monitoring
    }));

  
    const { data, error } = await supabase
      .from('traders')
      .insert(rows);

      console.log("succcess")
  
    if (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  });


//endpoint to get user stats
  app.get("/stats", async (req, res) => {
    try {
      const wallet = process.env.MY_WALLET_ADDRESS
  
      const [positionsRes, closedRes] = await Promise.all([
        fetch(`https://data-api.polymarket.com/positions?user=${wallet}`),
        fetch(`https://data-api.polymarket.com/closed-positions?user=${wallet}`)
      ])
  
      if (!positionsRes.ok || !closedRes.ok) {
        return res.status(500).json({ error: "failed to fetch polymarket data" })
      }
  
      const positions = await positionsRes.json()
      const closed = await closedRes.json()
  
      const now = new Date()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)
  
      const pnl7d = closed.reduce((sum, trade) => {
        const endDate = trade.endDate ? new Date(trade.endDate) : null
  
        if (endDate && endDate >= sevenDaysAgo) {
          return sum + Number(trade.realizedPnl || 0)
        }
  
        return sum
      }, 0)
  
      const buyTradesLast7Days = closed.filter((trade) => {
        if (!trade.endDate) return false
      
        const tradeDate = new Date(trade.endDate)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
        return (
          tradeDate >= sevenDaysAgo
        )
      })


      const tradesToday = buyTradesLast7Days.length 
  
      console.log("trades",tradesToday)
      const last7dClosed = closed.filter((trade) => {
        if (!trade.endDate) return false
        return new Date(trade.endDate) >= sevenDaysAgo
      })
  
      const wins = last7dClosed.filter(
        (trade) => Number(trade.realizedPnl || 0) > 0
      ).length
  
      const winRate7d =
        last7dClosed.length > 0
          ? ((wins / last7dClosed.length) * 100).toFixed(2) + "%"
          : "0.00%"
  
      const stats = [
        { label: "Bot Status", value: "LIVE", sub: "dot" },
        { label: "Trades(7d)", value: String(tradesToday) },
        { label: "Win Rate (7d)", value: winRate7d },
        {
          label: "PNL",
          value: `${pnl7d >= 0 ? "+" : "-"}$${Math.abs(pnl7d).toFixed(2)}`
        },
      ]
  
      res.json(stats)
    } catch (err) {
      console.log("stats route error", err)
      res.status(500).json({ error: "server error" })
    }
  })




  

app.listen(PORT, () => {
  console.log(`running on http://localhost:${PORT}`);
});