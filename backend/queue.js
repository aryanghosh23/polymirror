const {monitor} = require("./user_info")
const{Clean_trade} = require("./clean_trade")
let tradeQueue = []
let queuedJobs = new Set() //duplicate trades avoided
let isProcessing = false

async function processQueue() {
  if (isProcessing) return
  if (tradeQueue.length === 0) return

  isProcessing = true

  const job = tradeQueue.shift()

  try {
    const { body } = job

    const activities = body?.event?.activity || []

    const VALID_ADDRESSES = [ //dummy addresses change in the future with real addresses
      "0x1111111111111111111111111111111111111111",
      "0x64d62f624dff82248a645bb8007f2c8b012c8795",
      "0x000000"
    ]

    let userAddress = null

    for (let act of activities) {
      console.log("address", act.fromAddress)

      if (VALID_ADDRESSES.includes(act.fromAddress)) {
        userAddress = act.fromAddress
        break
      }
    }

    if (!userAddress) {
      console.log("Invalid or unknown address")
    } else {
      console.log("userAddress", userAddress)

      const trade = await monitor(userAddress) //get trade info
      console.log("monitor success", trade)

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

  for (let act of activities) { //verify if trade is a duplicate
    key = act.hash || act.transactionHash || act.fromAddress
    if (key) break
  }

  if (key && queuedJobs.has(key)) {
    console.log("duplicate job skipped:", key)
    return
  }

  if (key) {
    queuedJobs.add(key)
  }

  tradeQueue.push({ body, key })
  console.log("job added, length:", tradeQueue.length)
  processQueue()
}

module.exports = {
  addToQueue
}