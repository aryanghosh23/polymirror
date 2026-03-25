const express = require("express");
const {monitor} = require('./user_info')
const app = express();
const PORT = 8000;


app.use(express.json());


app.post("/", (req, res) => { 
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

      monitor(userAddress)
      return res.status(200).json({
        success: true,
        address: userAddress
      })
  })


//   app.get('/',(req,res) => { 


// monitor("0x64d62f624dff82248a645bb8007f2c8b012c8795")


// return res.status(200).json({
//     sucess: true
// })

//   })


app.listen(PORT, () => {
  console.log(`running on http://localhost:${PORT}`);
});