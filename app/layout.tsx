import "./globals.css";
import type { Metadata } from "next";
import { Baloo_2, Montserrat } from "next/font/google";
import Navbar from "@/components/Navbar";
import EMSFooter from "@/components/EMSFooter";
import dynamic from "next/dynamic";
import Providers from "./providers";
import { currentUserIdServer } from "@/lib/study/auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EnterMedSchool",
    template: "%s — EnterMedSchool",
  },
  description:
    "We help aspiring medical students find the right fit for their career goals. Browse medical schools, compare programs, and study for admission exams.",
  applicationName: "EnterMedSchool",
  category: "education",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "EnterMedSchool",
    title: "EnterMedSchool | Find The Right Medical School for You!",
    description:
      "We help aspiring medical students find the right fit for their career goals. Browse medical schools, compare programs, and study for admission exams.",
    images: [
      {
        url: "https://entermedschool.b-cdn.net/wp-content/uploads/2023/03/ems_thumbnail_2-1024x512.png",
        width: 1024,
        height: 512,
        alt: "EnterMedSchool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EnterMedSchool | Find The Right Medical School for You!",
    description:
      "We help aspiring medical students find the right fit for their career goals.",
    images: [
      "https://entermedschool.b-cdn.net/wp-content/uploads/2023/03/ems_thumbnail_2-1024x512.png",
    ],
  },
  themeColor: "#4F46E5", // indigo-600 (prominent brand blue)
  robots: process.env.NEXT_PUBLIC_ALLOW_INDEX === "true"
    ? { index: true, follow: true }
    : { index: false, follow: false },
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
          <main className="mx-auto max-w-[1400px] px-0 sm:px-6 py-6 flex-1">{children}</main>
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
