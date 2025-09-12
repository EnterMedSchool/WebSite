import "./globals.css";
import type { Metadata } from "next";
import { Baloo_2, Montserrat } from "next/font/google";
import Navbar from "@/components/Navbar";
import dynamic from "next/dynamic";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "WebSite",
  description: "Learning platform skeleton",
};

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700" ] });
const baloo = Baloo_2({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-baloo" });

// Study Rooms and floating widgets removed for now.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const RewardsOverlay = dynamic(() => import("@/components/xp/RewardsOverlay"), { ssr: false });
  return (
    <html lang="en">
      <body className={`${montserrat.className} ${baloo.variable} min-h-screen bg-gray-50 text-gray-900`}>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-[1400px] p-6">{children}</main>
          <RewardsOverlay />
        </Providers>
        {null}
      </body>
    </html>
  );
}
