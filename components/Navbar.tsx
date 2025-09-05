import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AuthButtons from "@/components/auth/AuthButtons";
import { isAdminSession } from "@/lib/authz";
import UniversitiesMenu from "@/components/nav/UniversitiesMenu";
import LeoLogo from "@/assets/LeoLogoWebsite.png";

export default async function Navbar() {
  const isAuthConfigured = Boolean(process.env.NEXTAUTH_SECRET);
  const session = isAuthConfigured ? await getServerSession(authOptions) : null;
  const isAdmin = isAdminSession(session);

  const primary = [
    { href: "/#universities", label: "Universities" },
    { href: "/#exams", label: "Entrance Exams" },
    { href: "/#communities", label: "Communities" },
    { href: "/#imat", label: "IMAT Course" },
  ];
  const secondary = [
    { href: "/blog", label: "Study Materials" },
    { href: "/#parents", label: "Information for Parents" },
    { href: "/#portal", label: "Student Portal" },
    { href: "/#scholarships", label: "Scholarship Program" },
  ];

  return (
    <header className="shadow-sm">
      {/* Top (blue) bar */}
      <div className="w-full bg-indigo-500 text-white">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src={LeoLogo} alt="EnterMedSchool" width={28} height={28} className="rounded" />
            <span className="font-brand text-xl tracking-wide">EnterMedSchool</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {/* Universities mega menu trigger */}
            <div className="relative"><UniversitiesMenu /></div>
            {/* Other primary items */}
            {primary.slice(1).map((item) => (
              <Link key={item.label} href={item.href} className="text-sm font-semibold uppercase tracking-wide text-white/90 hover:text-white">
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="text-sm font-semibold uppercase tracking-wide text-white/90 hover:text-white">
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <AuthButtons variant="light" isAuthed={!!session} name={session?.user?.name ?? undefined} />
          </div>
        </div>
      </div>

      {/* Secondary (white) bar */}
      <div className="w-full border-b bg-white">
        <div className="mx-auto hidden max-w-6xl items-center justify-center gap-8 px-4 py-3 sm:flex">
          {secondary.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-semibold uppercase tracking-wide text-indigo-600 hover:text-indigo-700"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
