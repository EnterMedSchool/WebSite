import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserMenu from "@/components/auth/UserMenu";
import UniversitiesMenu from "@/components/nav/UniversitiesMenu";
import LeoLogo from "@/assets/LeoLogoWebsite.png";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { xpToNext, GOAL_XP, MAX_LEVEL, levelFromXp } from "@/lib/xp";

export default async function Navbar() {
  const isAuthConfigured = Boolean(process.env.NEXTAUTH_SECRET);
  const session = isAuthConfigured ? await getServerSession(authOptions) : null;
  let levelInfo: { level: number; xp: number; pct: number; inLevel: number; span: number; nextLevel: number } | null = null;
  const sessUserId = Number(((session as any)?.userId) ?? 0);
  if (sessUserId || session?.user?.email) {
    try {
      let row: any | undefined;
      if (sessUserId) {
        row = (await db.select().from(users).where(eq(users.id, sessUserId)).limit(1))[0] as any;
      }
      if (!row && session?.user?.email) {
        const email = String(session.user.email).toLowerCase();
        row = (await db.select().from(users).where(eq(users.email as any, email)).limit(1))[0] as any;
      }
      if (!row) throw new Error('user not found');
      const xp = Number(row?.xp ?? 0);
      const level = Math.max(1, Math.min(Number(row?.level ?? 1), MAX_LEVEL));
      const effLevel = Math.min(levelFromXp(xp), MAX_LEVEL);
      if (effLevel >= MAX_LEVEL) {
        levelInfo = { level: MAX_LEVEL, xp, pct: 100, inLevel: 0, span: 1, nextLevel: MAX_LEVEL };
      } else {
        const { toNext, nextLevelGoal } = xpToNext(xp);
        const start = GOAL_XP[effLevel - 1];
        const span = Math.max(1, nextLevelGoal - start);
        const inLevel = Math.max(0, Math.min(span, span - toNext));
        const pct = Math.round((inLevel / span) * 100);
        levelInfo = { level: effLevel, xp, pct, inLevel, span, nextLevel: effLevel + 1 };
      }
    } catch {}
  }
  // Admin features removed; no admin link or checks

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
    <header className="sticky top-0 z-50 shadow-sm">
      {/* Top (blue) bar */}
      <div className="w-full bg-[#6C63FF] text-white">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src={LeoLogo} alt="EnterMedSchool" width={28} height={28} className="rounded" />
            <span className="font-brand text-xl tracking-wide">EnterMedSchool</span>
          </Link>

          <nav className="hidden items-center gap-10 md:flex">
            {/* Universities mega menu trigger */}
            <UniversitiesMenu />
            {/* Other primary items */}
            {primary.slice(1).map((item) => (
              <Link key={item.label} href={item.href} className="text-sm font-semibold uppercase tracking-wide text-white/90 hover:text-white">
                {item.label}
              </Link>
            ))}
            {/* Admin features removed */}
          </nav>

          <div className="flex items-center gap-3">
            <UserMenu
              isAuthed={!!session}
              name={session?.user?.name ?? undefined}
              imageUrl={(session as any)?.user?.image ?? undefined}
              level={levelInfo?.level}
              xpPct={levelInfo?.pct}
              xpInLevel={levelInfo?.inLevel}
              xpSpan={levelInfo?.span}
            />
          </div>
        </div>
      </div>

      {/* Secondary (white) bar */}
      <div className="w-full border-b bg-white">
        <div className="mx-auto hidden max-w-6xl items-center justify-center gap-10 px-4 py-3 sm:flex">
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
