//method to score users takes in json object
// { wallet: '0x64d62f624dff82248a645bb8007f2c8b012c8795',
// win_rate: 0.4706,
// total_pnl: 0.39,
// money_won: 0.39,
// money_lost: 0,
// rank: 262580}
// 
// 
//going to return json object in this format {wallet_address: 0x123,  trusted_score: 8.0,   still_monitoring: true} and store in db

function scoring_traders(trades) { 

  // console.log("trades",trades)
        return trades.map((t) => {
          let score = 0;
      
          // Win rate
          if (t.win_rate > 0.7) score += 3; 
          else if (t.win_rate > 0.6) score += 2;
          else if (t.win_rate > 0.5) score += 1;
      
          // total pnl profit basically
          if (t.total_pnl > 10000) score += 2;
          else if (t.total_pnl > 1000) score += 1;
      
          // money made vs money lost
          let efficiency;
          if (t.money_lost === 0) efficiency = t.money_won > 0 ? Infinity : 0; //edge case for dividing by 0
          else efficiency = t.money_won / t.money_lost; //score of 2 or higher very good means there making 2-1 profit ratio
      
          if (efficiency > 2) score += 2;
          else if (efficiency > 1.2) score += 1; //slight profit ratio
      

          
          return score
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