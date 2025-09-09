import "./globals.css";
import type { Metadata } from "next";
import { Baloo_2, Montserrat } from "next/font/google";
import Navbar from "@/components/Navbar";
import dynamic from "next/dynamic";
import Providers from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "WebSite",
  description: "Learning platform skeleton",
};

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700" ] });
const baloo = Baloo_2({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-baloo" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const QuickDock = dynamic(() => import("@/components/study/QuickDock"), { ssr: false });
  const RewardsOverlay = dynamic(() => import("@/components/xp/RewardsOverlay"), { ssr: false });
  return (
    <html lang="en">
      <body className={`${montserrat.className} ${baloo.variable} min-h-screen bg-gray-50 text-gray-900`}>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl p-6">{children}</main>
          <QuickDock />
          <RewardsOverlay />
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
