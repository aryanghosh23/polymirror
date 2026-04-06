import Sidebar from "../components/sidebar"
import Header from "../components/Header"
export default function TradersPage() {
  return (
    <main className="min-h-screen bg-[#020f2d] text-white">
      <div className="border border-[#1d4679]">
        <Header />
        <div className="grid min-h-[calc(100vh-72px)] grid-cols-[270px_1fr]">
          <Sidebar currentPath="/traders" />
          <section className="p-8">
            <h2 className="text-4xl font-semibold">Traders</h2>
            <p className="mt-4 text-xl text-[#9fb2d1]">Dummy traders page</p>
          </section>
        </div>
      </div>
    </main>
  )
}