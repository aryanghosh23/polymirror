//address that were going to be monitoring, if change in polymarket blockchain was detected, look for the address that the change came from 
//need another method to validate if its coming from polymarket or not 

async function monitor(address) {
    if (!address) return


    const pollStart = Date.now()
    const TIMEOUT = 1 * 60 * 1000 // 3 minutes
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

        const newActivity = data.filter(item => {
          const timestampMs = new Date(item.timestamp * 1000)
          return timestampMs >= threshold
        })
  
        if (newActivity.length > 0) {
          console.log("NEW DATA:", newActivity) //new data from the user such as their most recent trade
          return newActivity
        }
  
        console.log("no new data yet...")
      } catch (err) {
        console.log("error", err)
      }
  
      await new Promise(res => setTimeout(res, 5000)) // 5 sec delay
    }
  
    return {
      success: false,
      message: "No new data found" //not relevant data 
    }
  }
  
  module.exports = { monitor }