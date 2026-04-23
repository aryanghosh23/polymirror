//file to execute the trades 

const { ClobClient, OrderType, Side } = require("@polymarket/clob-client");
const { Wallet } = require("@ethersproject/wallet");
require("dotenv").config();

const host = "https://clob.polymarket.com";
const chainId = 137;
const BUY_AMOUNT_USDC = 1;

const funder = process.env.MY_WALLET_ADDRESS; // This is your Polymarket Profile Address, where you send UDSC to.
const privateKey = process.env.PRIVATE_KEY; // This is your Private Key. If using email login export from https://reveal.magic.link/polymarket otherwise export from your Web3 Application

if (!funder || !privateKey) {
  throw new Error("missing .env values");
}

const signer = new Wallet(privateKey);

//0: Browser Wallet(Metamask, Coinbase Wallet, etc)
//1: Magic/Email Login
const signatureType = 1;

function getOrderSide(side) {
  return String(side || "").toUpperCase() === "SELL" ? Side.SELL : Side.BUY
}

function getOrderSize(price, size, side) {
  const orderSide = getOrderSide(side)
  const numericPrice = Number(price)

  if (orderSide === Side.BUY) {
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      throw new Error("invalid price for fixed $1 buy")
    }

    return BUY_AMOUNT_USDC / numericPrice
  }

  return size
}

async function execute (tokenID, price, size, side = "BUY")  { //buys always copy with $1; sells use the passed share size
  try {
    const creds = await new ClobClient(host, chainId, signer).createOrDeriveApiKey();

    const clobClient = new ClobClient(
      host,
      chainId,
      signer,
      creds,
      signatureType,
      funder
    );

    const resp2 = await clobClient.createAndPostOrder(
      {
        tokenID: tokenID, //type of market(the clobID)
        price: price,
        side: getOrderSide(side),
        size: getOrderSize(price, size, side),
      },
      { tickSize: "0.01", negRisk: false }, ///You'll need to adjust these based on the market
      OrderType.GTC
    );

    console.log(resp2);
  } catch (err) {
    console.error(err);
  }
};


module.exports = {execute}
