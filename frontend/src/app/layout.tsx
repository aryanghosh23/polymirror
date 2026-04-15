import type { Metadata } from "next";
import "./globals.css";
import MainLayout from "@/components/layout/MainLayout";

export const metadata: Metadata = {
  title: "PolyMirror — Smart Copy Trading",
  description: "Automated copy trading for Polymarket prediction markets",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
