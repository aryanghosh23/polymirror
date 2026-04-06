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
      
          
          return {
            wallet_address: t.wallet,       //going to be added in db
            trusted_score: score,  //metric to determine if x trade is good trade
            still_monitoring: true

          };
        });
      }



module.exports = {scoring_traders}