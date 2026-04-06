//return token id, size, price going to pass as arguments for execute.js 

//for now only going to record buys 
const {execute} = require("./execute")
const {createClient} = require("@supabase/supabase-js")

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )


async function Clean_trade(trade) { //output of user_info.js is going to be fed in here 

    const result = trade.filter((trade) => trade.side === "BUY").map(item => ({
        
        price: item.price,
        size: item.usdcSize / item.price,
        tokenId: item.asset,
        icon: item.icon,
        title: item.title,
        copy_wallet: item.proxyWallet,
        position: item.outcome,
        usdcSize: item.usdcSize 

      }))

      if(result.length == 0) {
        console.log("not a buy")
        return
      }

    //   console.log(result[0].tokenId,result[0].price,result[0].size)


    //   execute(result[0].tokenId,result[0].price,result[0].size)

      //if trade execute is valid insert into db cause trade was successul

      try { 

      const { data, error } = await supabase
  .from("trades")
  .insert([
    {
      user_copy: result[0].copy_wallet,
      trade_name: result[0].title,
      icon: result[0].icon ,
      price: result[0].usdcSize,
      position: result[0].position,
      trade_score: 86
    }
  ]);
      }catch(err)  {
        console.log("err",err)
      }



}

// Clean_trade(
//  [
//   {
//     proxyWallet: '0x64d62f624dff82248a645bb8007f2c8b012c8795',
//     timestamp: 1775417251,
//     conditionId: '0x4c0348dfc0c77e682c30ebccb0d4662933a81356540bc39ef8992a220f1a93d3',
//     type: 'TRADE',
//     size: 1.2425,
//     usdcSize: 1,
//     transactionHash: '0x97b178352aba3ac88bd402edb0f171e2aa0f5f09cde4935cf5af67b54797c528',
//     price: 0.8,
//     asset: '42468362424968849700578753221017831350877530533963822510347586233389497947510',
//     side: 'BUY',
//     outcomeIndex: 1,
//     title: 'Raptors vs. Celtics',
//     slug: 'nba-tor-bos-2026-04-05',
//     icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/super+cool+basketball+in+red+and+blue+wow.png',
//     eventSlug: 'nba-tor-bos-2026-04-05',
//     outcome: 'Celtics',
//     name: '0x64d62f624DFf82248a645BB8007f2C8b012C8795-1773982232999',
//     pseudonym: 'Mature-Burglar',
//     bio: '',
//     profileImage: '',
//     profileImageOptimized: ''
//   }
// ])

module.exports = {Clean_trade}