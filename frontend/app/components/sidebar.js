import Link from "next/link"
const menu = [
    { name: "Dashboard", href: "/" },
    { name: "Traders", href: "/traders" },
    { name: "Live Trades", href: "/live-trades" },
    { name: "Bot Config", href: "/bot-config" },
    { name: "History", href: "/history" },
  ]
  
export default function Sidebar(currentPath) {
    return (
      <aside className="border-r border-[#1d4679] bg-[#020b22]">
        {menu.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`block border-b border-[#1d4679] px-10 py-8 text-2xl text-[#9fb2d1] ${
              currentPath === item.href ? "bg-[#0d234d] text-white" : ""
            }`}
          >
            {item.name}
          </Link>
        ))}
      </aside>
    )
  }