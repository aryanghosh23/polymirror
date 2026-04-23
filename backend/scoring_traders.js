//method to score users takes in json object from poly_traders
// returns a trusted score out of 10

function normalizeRate(value) {
  const rate = Number(value) || 0
  return rate > 1 ? rate / 100 : rate
}

function scoring_traders(trades) { 

  // console.log("trades",trades)
        return trades.map((t) => {
          let score = 0;
          const drawdown = normalizeRate(t.small_drawdown ?? t.drawdown ?? t.max_drawdown)
          const moneyWon = Number(t.money_won) || 0
          const moneyLost = Number(t.money_lost) || 0
          const winPercentage = normalizeRate(t.win_percentage ?? t.win_rate)
          const avgTradePnl = Number(t.avg_trade_pnl) || 0
          const tradeCount = Number(t.trade_count ?? t.trades_count ?? t.num_trades ?? t.total_trades) || 0
          const efficiency = moneyLost === 0 ? (moneyWon > 0 ? Infinity : 0) : moneyWon / moneyLost

          // Drawdown score: max 4
          if (drawdown < 0.05) score += 4
          else if (drawdown < 0.1) score += 3
          else if (drawdown < 0.2) score += 2

          // Efficiency score: max 3
          if (efficiency >= 2) score += 3
          else if (efficiency >= 1.5) score += 2
          else if (efficiency >= 1.2) score += 1

          // Win percentage score: max 2
          if (winPercentage >= 0.65) score += 2
          else if (winPercentage >= 0.55) score += 1

          // Trade quality score: max 1
          if (avgTradePnl >= 50) score += 1
          else if (avgTradePnl >= 20) score += 0.5

          // Trade count confidence multiplier
          if (tradeCount < 3) score *= 0.5
          else if (tradeCount < 5) score *= 0.75
          else if (tradeCount < 10) score *= 0.9
          
          return Math.round(score * 100) / 100
        });
      }


      // console.log(scoring_traders([
      //   {
      //     "wallet": "0xbb50e43f1336ac544b71ec3eec51df35e9e5f7c9",
      //     "win_rate": 34.025,
      //     "money_won": 1583.9,
      //     "money_lost": 0,
      //     "total_pnl": 1583.9
      //   },
      //   {
      //     "wallet": "0x70831c34434486ffb8e33270642604d9c5731937",
      //     "win_rate": 27.27,
      //     "money_won": 580.17,
      //     "money_lost": 0,
      //     "total_pnl": 580.17
      //   },
      //   {
      //     "wallet": "0xbdcb293dd41148a20895d0e818c0d96c0756e811",
      //     "win_rate": 24.05,
      //     "money_won": 13431.81,
      //     "money_lost": 0,
      //     "total_pnl": 13431.81
      //   },
      //   {
      //     "wallet": "0x2fbccc3918a358ef674854dbd4bbd89b896ef944",
      //     "win_rate": 26.787,
      //     "money_won": 5035.11,
      //     "money_lost": 1778.95,
      //     "total_pnl": 3256.16
      //   },
      //   {
      //     "wallet": "0x730da7d292794217736d5e4c4653c6cf0473d448",
      //     "win_rate": 7.45,
      //     "money_won": 2255.48,
      //     "money_lost": 0,
      //     "total_pnl": 2255.48
      //   }
      // ]))

module.exports = {scoring_traders}
