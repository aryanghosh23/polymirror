const {monitor} = require("./user_info")
const{Clean_trade} = require("./clean_trade")
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

let tradeQueue = []
let queuedJobs = new Set() //duplicate trades avoided
let isProcessing = false

async function getMonitoredAddresses() {
  const { data, error } = await supabase
    .from("traders")
    .select("wallet_address")
    .eq("still_monitoring", true)

  if (error) {
    console.log("supabase monitored addresses error", error)
    return []
  }

  return (data || [])
    .map((trader) => trader.wallet_address)
    .filter(Boolean)
}

async function processQueue() {
  if (isProcessing) return
  if (tradeQueue.length === 0) return

  isProcessing = true

  const job = tradeQueue.shift()

  try {
    const { body, transactionHash } = job

    const activities = body?.event?.activity || []
    const monitoredAddresses = await getMonitoredAddresses()
    const validAddresses = new Set(monitoredAddresses.map((address) => address.toLowerCase()))

    let userAddress = null

    for (let act of activities) {
      // console.log("address", act.fromAddress)

      const fromAddress = act.fromAddress?.toLowerCase()
      if (fromAddress && validAddresses.has(fromAddress)) {
        userAddress = monitoredAddresses.find((address) => address.toLowerCase() === fromAddress) || act.fromAddress
        break
      }
    }

    if (!userAddress) {
      console.log("Invalid or unknown address")
    } else {
      console.log("userAddress", userAddress)

      const trade = await monitor(userAddress, transactionHash) //get trade info
      console.log("monitor success", trade)

      if (!Array.isArray(trade) || trade.length === 0) {
        console.log("no new trade found")
        return
      }

      await Clean_trade(trade, userAddress) //this will add trade to db, rank it, and execute it 
      console.log("clean_trade success")
    }
  } catch (err) {
    console.log("queue error", err)
  } finally {
    if (job?.key) {
      queuedJobs.delete(job.key)
    }
    isProcessing = false
    processQueue() //call again incase something in queue
  }
}

function addToQueue(body) {
  const activities = body?.event?.activity || [] 

  let key = null
  let transactionHash = null

  for (let act of activities) { //verify if trade is a duplicate
    transactionHash = act.hash || act.transactionHash || null
    key = transactionHash || act.fromAddress
    if (key) break
  }

  if (key && queuedJobs.has(key)) {
    console.log("duplicate job skipped:", key)
    return
  }

  if (key) {
    queuedJobs.add(key)
  }

  tradeQueue.push({ body, key, transactionHash })
  console.log("job added, length:", tradeQueue.length)
  processQueue()
}

module.exports = {
  addToQueue
}
