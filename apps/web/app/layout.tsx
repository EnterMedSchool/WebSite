import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'EnterMedSchool',
  description: 'Learning platform MVP',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-semibold">EnterMedSchool</a>
            <nav className="flex gap-4 text-sm">
              <a href="/blog">Blog</a>
              <a href="/studio">Studio</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          {children}
        </main>
        <footer className="border-t">
          <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-gray-500">
            © {new Date().getFullYear()} EnterMedSchool
          </div>
        </footer>
      </body>
    </html>
  )
}

