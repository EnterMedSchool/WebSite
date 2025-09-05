import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AuthButtons from "@/components/auth/AuthButtons";

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">WebSite</Link>
          <nav className="hidden gap-4 sm:flex">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link href="/course/foundation" className="text-gray-600 hover:text-gray-900">Course</Link>
            <Link href="/quiz/42" className="text-gray-600 hover:text-gray-900">Quiz</Link>
          </nav>
        </div>
        <AuthButtons isAuthed={!!session} name={session?.user?.name ?? undefined} />
      </div>
    </header>
  );
}

