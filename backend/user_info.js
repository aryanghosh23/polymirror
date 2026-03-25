async function monitor(address) {
    if (!address) return


    const pollStart = Date.now()
    const TIMEOUT = 3 * 60 * 1000 // 3 minutes
    const threshold = pollStart - (3 * 60 * 1000) //pollstart - 3 minutes cause of potential delays
  
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
          console.log("NEW DATA:", newActivity)
          return newActivity
        }
  
        console.log("no new data yet...")
      } catch (err) {
        console.log("error", err)
      }
  
      await new Promise(res => setTimeout(res, 5000))
    }
  
    return {
      success: false,
      message: "No new data found"
    }
  }
  
  module.exports = { monitor }