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

const STUDY_ENABLED = (process.env.NEXT_PUBLIC_STUDY_ROOMS_ENABLED === '1') || (process.env.NEXT_PUBLIC_STUDY_ROOMS_ENABLED === 'true') || (process.env.STUDY_ROOMS_ENABLED === '1') || (process.env.STUDY_ROOMS_ENABLED === 'true');

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const QuickDock = STUDY_ENABLED ? dynamic(() => import("@/components/study/QuickDock"), { ssr: false }) : (() => null as any);
  const RewardsOverlay = dynamic(() => import("@/components/xp/RewardsOverlay"), { ssr: false });
  return (
    <html lang="en">
      <body className={`${montserrat.className} ${baloo.variable} min-h-screen bg-gray-50 text-gray-900`}>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl p-6">{children}</main>
          {STUDY_ENABLED ? <QuickDock /> : null}
          <RewardsOverlay />
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
