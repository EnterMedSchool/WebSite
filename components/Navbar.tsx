import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserMenu from "@/components/auth/UserMenu";
import UniversitiesMenu from "@/components/nav/UniversitiesMenu";
import ResourcesMenu from "@/components/nav/ResourcesMenu";
import LeoLogo from "@/assets/LeoLogoWebsite.png";
import { db, sql } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { xpToNext, GOAL_XP, MAX_LEVEL, levelFromXp } from "@/lib/xp";

export default async function Navbar() {
  // Ensure this server component is always dynamic (no caching),
  // so session/xp reflect the current user state after login/logout.
  noStore();
  const isAuthConfigured = Boolean(process.env.NEXTAUTH_SECRET);
  const session = isAuthConfigured ? await getServerSession(authOptions) : null;
  let levelInfo: { level: number; xp: number; pct: number; inLevel: number; span: number; nextLevel: number; isMax: boolean } | null = null;
  // Prefer email lookup (more stable), then fallback to numeric userId
  const sessUserIdRaw = Number(((session as any)?.userId) ?? 0);
  const sessEmail = (session?.user?.email || "").toString().toLowerCase().trim();
  const sessUserId = (Number.isSafeInteger(sessUserIdRaw) && sessUserIdRaw > 0 && sessUserIdRaw <= 2147483647) ? sessUserIdRaw : 0;
  if (sessUserId || sessEmail) {
    try {
      let row: any | undefined;
      if (sessEmail) {
        const rEmail = await sql`SELECT xp, level FROM users WHERE lower(email)=${sessEmail} LIMIT 1`;
        row = rEmail.rows[0];
      }
      if (!row && sessUserId) {
        const rId = await sql`SELECT xp, level FROM users WHERE id=${sessUserId} LIMIT 1`;
        row = rId.rows[0];
      }
      if (!row) throw new Error('user not found');
      const xp = Number(row?.xp ?? 0);
      const level = Math.max(1, Math.min(Number(row?.level ?? 1), MAX_LEVEL));
      const effLevel = Math.min(levelFromXp(xp), MAX_LEVEL);
      if (effLevel >= MAX_LEVEL) {
        levelInfo = { level: MAX_LEVEL, xp, pct: 100, inLevel: 0, span: 1, nextLevel: MAX_LEVEL, isMax: true };
      } else {
        const { toNext, nextLevelGoal } = xpToNext(xp);
        const start = GOAL_XP[effLevel - 1];
        const span = Math.max(1, nextLevelGoal - start);
        const inLevel = Math.max(0, Math.min(span, span - toNext));
        const pct = Math.round((inLevel / span) * 100);
        levelInfo = { level: effLevel, xp, pct, inLevel, span, nextLevel: effLevel + 1, isMax: false };
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
    <header className="sticky top-0 z-50">
      {/* Single condensed gradient bar */}
      <div className="w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_10px_30px_rgba(99,102,241,0.35)]">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2">
            <Image src={LeoLogo} alt="EnterMedSchool" width={28} height={28} className="rounded" />
            <span className="font-brand text-xl tracking-wide">EnterMedSchool</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <UniversitiesMenu />
            <Link href={primary[1].href} className="text-xs font-semibold uppercase tracking-wide text-white/90 hover:text-white">{primary[1].label}</Link>
            <Link href={primary[2].href} className="text-xs font-semibold uppercase tracking-wide text-white/90 hover:text-white">{primary[2].label}</Link>
            <Link href={primary[3].href} className="text-xs font-semibold uppercase tracking-wide text-white/90 hover:text-white">{primary[3].label}</Link>
            <ResourcesMenu />
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
              isMax={levelInfo?.isMax}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
