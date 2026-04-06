"use client"
import Link from "next/link"
import Sidebar from "./components/sidebar"
import Header from "./components/Header"
import { useState, useEffect } from "react"


export default function Dashboard() {
  const [trades, setTrades] = useState<any[]>([])
const [stats, setStatus] = useState<any>([])

useEffect(() => {
  const load_dash = async () => {
    try {
      const [tradesRes, statsRes] = await Promise.all([
        fetch("http://localhost:8000/trades"),
        fetch("http://localhost:8000/stats"),
      ])

      const tradesData = await tradesRes.json()
      const statsData = await statsRes.json()

      setTrades(tradesData)
      setStatus(statsData)
    } catch (err) {
      console.log("error", err)
    }
  }

  load_dash()
}, [])

console.log("stats",stats)

  const shortenWallet = (wallet: string) => {
    if (!wallet) return "N/A"
    if (wallet.length <= 10) return wallet
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
  }

  return (
    <main className="min-h-screen bg-[#020f2d] text-white">
      <div className="border border-[#1d4679]">
        <Header />

        <div className="grid min-h-[calc(100vh-72px)] grid-cols-[270px_1fr]">
          <Sidebar currentPath="/" />

          <section className="p-5 md:p-8">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {stats?.map((item) => (
                <div
                  key={item.label}
                  className="border border-[#1d4679] bg-[#081d45] px-8 py-7"
                >
                  <p className="mb-6 text-center text-xl text-[#8fa5c7]">{item.label}</p>

                  {item.sub === "dot" ? (
                    <div className="flex items-center justify-center gap-4 text-[#14e0b3]">
                      <span className="h-11 w-11 rounded-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)]" />
                      <span className="text-5xl font-semibold">{item.value}</span>
                    </div>
                  ) : (
                    <p
                      className={`text-center text-5xl font-semibold ${
                        item.label === "Trades Today"
                          ? "text-[#53a8ff]"
                          : "text-[#14e0b3]"
                      }`}
                    >
                      {item.value}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-x-auto">
              <div className="min-w-[1300px]">
              <div className="grid grid-cols-[2.5fr_1.5fr_1.4fr_1.2fr_1.2fr_1.8fr] border border-[#1d4679] bg-[#0d234d] px-7 py-5 text-lg font-semibold text-[#53a8ff]">
  <p>Market</p>
  <p>Trader</p>
  <p>Trade Score</p>
  <p>Position</p>
  <p>Price</p>
  <p>Created</p>
</div>

                <div className="mt-4 space-y-4">
                  {trades.map((trade) => (
                    <div
                    key={trade.id}
                    className="grid grid-cols-[2.5fr_1.5fr_1.4fr_1.2fr_1.2fr_1.8fr] items-center border border-[#1d4679] bg-[#020f2d] px-7 py-6 text-lg"
                  >
                      <div className="flex items-center gap-4 pr-6">
                        <img
                          src={trade.icon}
                          alt={trade.trade_name}
                          className="h-12 w-12 rounded-full object-cover border border-[#1d4679]"
                        />
                        <p className="font-medium text-white">{trade.trade_name}</p>
                      </div>

                      <p className="text-[#53a8ff] font-medium">
                        {shortenWallet(trade.user_copy)}
                      </p>

                    

                      <p className="text-[#ffbf2f]">
                        {trade.trade_score ?? "N/A"}
                      </p>

                      <p>{trade.position ?? "N/A"}</p>

                      <p>{trade.price ?? "N/A"}</p>

                      <p className="text-[#8fa5c7]">
                        {trade.created_at
                          ? new Date(trade.created_at).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}





