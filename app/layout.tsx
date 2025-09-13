import "./globals.css";
import type { Metadata } from "next";
import { Baloo_2, Montserrat } from "next/font/google";
import Navbar from "@/components/Navbar";
import EMSFooter from "@/components/EMSFooter";
import dynamic from "next/dynamic";
import Providers from "./providers";
import { currentUserIdServer } from "@/lib/study/auth";

export const metadata: Metadata = {
  title: "WebSite",
  description: "Learning platform skeleton",
};

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700" ] });
const baloo = Baloo_2({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-baloo" });

// Floating timer & tasks widgets (feature-flagged)

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const RewardsOverlay = dynamic(() => import("@/components/xp/RewardsOverlay"), { ssr: false });
  const TimerWidget = dynamic(() => import("@/components/widgets/TimerWidget"), { ssr: false });
  const TasksWidget = dynamic(() => import("@/components/widgets/TasksWidget"), { ssr: false });
  const uid = await currentUserIdServer();
  const isAuthed = !!uid;
  return (
    <html lang="en">
      <body data-authed={isAuthed ? '1' : '0'} className={`${montserrat.className} ${baloo.variable} min-h-screen bg-gray-50 text-gray-900 flex flex-col`}>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-[1400px] p-6 flex-1">{children}</main>
          <EMSFooter />
          <RewardsOverlay />
          <TimerWidget />
          <TasksWidget />
        </Providers>
        <script
          // Expose a tiny, non-sensitive flag to avoid unnecessary authed API calls on client
          dangerouslySetInnerHTML={{ __html: `window.__ems_authed=${isAuthed ? 'true' : 'false'}` }}
        />
      </body>
    </html>
  );
}
