//main file were copy trading bot will perform trading
const express = require("express");
const {monitor} = require('./user_info')
const {traders} = require('./traders')
const {createClient} = require("@supabase/supabase-js")
const {addToQueue} = require("./queue")
const {Clean_trade} = require("./clean_trade")

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
app.post("/", (req, res) => {
  addToQueue(req.body) //add trade to the queue

  return res.status(200).json({
    success: true,
    message: "Queued"
  })
})

//endpoint to return most recent trades
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

  const addresses = await copy_traders()
  console.log("address", addresses)

  const users = await traders(addresses)
  console.log("users", users)

  const rows = users.map(user => ({
    wallet_address: user.wallet,
    trusted_score: user.score,
    still_monitoring: true,
    statistics: user.statistics
  }));

  const { data, error } = await supabase
    .from('traders')
    .upsert(rows, { onConflict: 'wallet_address' });

  if (error) {
    console.log(error);
    return res.status(500).json({ error });
  }

  console.log("success")
  return res.status(200).json(data)
});


//from here and below write endpoints to get user data to be reflected in the frontend

// all tracked traders with their scores and statistics
app.get("/traders", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("traders")
      .select("*")
      .order("trusted_score", { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// single trader by wallet address
app.get("/traders/:wallet", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("traders")
      .select("*")
      .eq("wallet_address", req.params.wallet)
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// dashboard summary — bot status, trade counts, win rate, p&l
app.get("/dashboard", async (_req, res) => {
  try {
    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")

    if (error) throw error

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tradesToday = trades.filter(t => new Date(t.created_at) >= today).length

    const executed = trades.filter(t => t.status === "EXECUTE")
    const wins = executed.filter(t => t.trade_score >= 7)
    const winRate = executed.length > 0 ? wins.length / executed.length : 0

    const { data: trackedTraders, error: traderErr } = await supabase
      .from("traders")
      .select("wallet_address")
      .eq("still_monitoring", true)

    if (traderErr) throw traderErr

    res.json({
      botStatus: "running",
      tradesToday,
      winRate7d: winRate,
      activeTradersTracked: trackedTraders.length,
      totalExecuted: executed.length,
      totalPassed: trades.filter(t => t.status === "PASS").length,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


app.listen(PORT, () => {
  console.log(`running on http://localhost:${PORT}`);
});