import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Welcome 👋</h1>
        <p className="mt-2 text-gray-600">
          This is a minimal, scalable skeleton for a learning platform: Next.js App Router, TypeScript, Tailwind, basic auth, and API routes.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard" className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition">
          <h2 className="text-lg font-medium">Dashboard (protected)</h2>
          <p className="text-gray-600">Requires sign-in. Uses NextAuth (credentials or GitHub).</p>
        </Link>
        <Link href="/course/foundation" className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition">
          <h2 className="text-lg font-medium">Course page</h2>
          <p className="text-gray-600">Dynamic route example at /course/[slug].</p>
        </Link>
        <Link href="/quiz/42" className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition">
          <h2 className="text-lg font-medium">Quiz page</h2>
          <p className="text-gray-600">Interactive page shell that fetches from /api/quiz/[id].</p>
        </Link>
        <Link href="/api/health" className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition">
          <h2 className="text-lg font-medium">API health</h2>
          <p className="text-gray-600">Simple JSON endpoint.</p>
        </Link>
      </section>
    </div>
  );
}

