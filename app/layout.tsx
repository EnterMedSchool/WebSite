import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "WebSite",
  description: "Learning platform skeleton",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-900`}>
        <Navbar />
        <main className="mx-auto max-w-5xl p-4">{children}</main>
      </body>
    </html>
  );
}

