"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type Leader = { name: string; points: number; color: string };
type FeedItem = { who: string; action: string; time: string; tone: string };
type EventItem = { title: string; at: string; tag: string };

const LEADERS: Leader[] = [
  { name: "Sapienza", points: 1380, color: "from-indigo-600 to-violet-600" },
  { name: "Tor Vergata", points: 1215, color: "from-violet-600 to-fuchsia-600" },
  { name: "Pavia", points: 990, color: "from-emerald-600 to-lime-600" },
];

const FEED: FeedItem[] = [
  { who: "Ava L.", action: "shared ECG cheat sheet", time: "2m", tone: "emerald" },
  { who: "Marco R.", action: "opened Case: Chest pain", time: "8m", tone: "violet" },
  { who: "Sara P.", action: "posted Anatomy quiz 3", time: "12m", tone: "indigo" },
  { who: "Noah T.", action: "uploaded Pharm flashcards", time: "18m", tone: "fuchsia" },
];

const EVENTS: EventItem[] = [
  { title: "Clinical Case Night", at: "Today 18:00", tag: "Team" },
  { title: "Neuroanatomy Sprint", at: "Tomorrow 10:00", tag: "Study" },
];

function toneBg(t: string) {
  if (t === "emerald") return "bg-emerald-500";
  if (t === "violet") return "bg-violet-500";
  if (t === "indigo") return "bg-indigo-500";
  if (t === "fuchsia") return "bg-fuchsia-500";
  return "bg-slate-500";
}

function NewBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-2.5 ${
        small ? "py-0.5 text-[10px]" : "py-1 text-xs"
      } font-bold text-white shadow-[0_8px_24px_rgba(251,191,36,0.35)]`}
    >
      NEW
    </span>
  );
}

function CourseMatesWidget() {
  const total = Math.max(...LEADERS.map((l) => l.points));
  return (
    <motion.div
      initial={{ rotate: -1.5, y: 8, opacity: 0 }}
      whileInView={{ rotate: 0, y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 14 }}
      viewport={{ once: true, amount: 0.4 }}
      className="relative isolate w-full rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-4 text-white shadow-[0_18px_50px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20"
      aria-label="Course Mates Hub preview"
    >
      {/* subtle edge glow */}
      <div className="pointer-events-none absolute -inset-px -z-10 rounded-3xl bg-[radial-gradient(600px_140px_at_50%_0%,rgba(255,255,255,0.06),transparent)]" />

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 text-white shadow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20l9-5-9-5-9 5 9 5Z"/><path d="M3 7l9-5 9 5"/></svg>
          </div>
          <div className="text-sm font-semibold">Course Mates Hub</div>
          <NewBadge small />
        </div>
        <div className="text-xs text-white/70">Static demo</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: "Online", value: 27 },
          { label: "Events", value: 6 },
          { label: "Notes", value: 42 },
          { label: "XP", value: 25620 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white/10 p-2 ring-1 ring-white/10">
            <div className="text-lg font-extrabold text-white">{s.value}</div>
            <div className="text-[10px] uppercase tracking-wide text-indigo-100/80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Agenda + Feed */}
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold text-white/90">Today&apos;s Agenda</div>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90 ring-1 ring-white/20">Auto-sync</span>
          </div>
          <ul className="space-y-2 text-sm">
            {EVENTS.map((e) => (
              <li key={e.title} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/10">
                <div className="flex items-center gap-2">
                  <span className="inline-grid h-6 w-6 place-items-center rounded-lg bg-indigo-500 text-white text-[10px]">{e.tag}</span>
                  <span className="font-medium text-white/90">{e.title}</span>
                </div>
                <span className="text-xs text-indigo-100/80">{e.at}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
          <div className="mb-2 text-xs font-semibold text-white/90">Live Feed</div>
          <ul className="space-y-2 text-sm">
            {FEED.map((f, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-white/10">
                <div className="flex items-center gap-2">
                  <div className={`grid h-7 w-7 place-items-center rounded-full text-white shadow ${toneBg(f.tone)}`}>
                    {f.who.charAt(0)}
                  </div>
                  <span className="text-white/90"><b>{f.who}</b> {f.action}</span>
                </div>
                <span className="text-xs text-indigo-100/80">{f.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold text-white/90">Weekly Leaderboard</div>
          <span className="text-[10px] text-indigo-100/80">Top 3</span>
        </div>
        <div className="space-y-2">
          {LEADERS.map((l) => (
            <div key={l.name}>
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium text-white/90">{l.name}</div>
                <div className="text-xs text-indigo-100/80">{l.points.toLocaleString()} XP</div>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${l.color}`}
                  style={{ width: `${(l.points / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-indigo-100/80">Grow XP with mates, events, and cases.</div>
        <button className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-indigo-700 shadow hover:bg-indigo-50">Open Hub</button>
      </div>
    </motion.div>
  );
}

export default function EnterMedSchool2026() {
  const news = Array.from({ length: 14 }).map((_, i) => (
    <motion.span
      key={i}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 0.25, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ delay: 0.05 * i, duration: 0.5 }}
      className="select-none rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-extrabold tracking-widest text-indigo-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-indigo-200"
      style={{ transform: `rotate(${(i % 2 ? -1 : 1) * 12}deg)` }}
    >
      NEW
    </motion.span>
  ));

  return (
    <section id="entermedschool-2026" className="relative mx-auto w-full max-w-6xl px-4">
      {/* Softer decorative blobs for depth */}
      <div className="pointer-events-none absolute -top-24 right-[-10%] h-80 w-80 rounded-full bg-gradient-to-br from-indigo-300/15 via-violet-300/10 to-fuchsia-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-[-6%] h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-300/12 via-cyan-300/10 to-indigo-300/12 blur-3xl" />

      <div className="grid items-center gap-8 md:grid-cols-2">
        {/* Left copy (darker to sit on the white page background) */}
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <NewBadge />
            <span className="text-xs font-medium uppercase tracking-wider text-indigo-700/90 dark:text-indigo-200/90">Feature wave</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            EnterMedSchool <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-violet-600 to-fuchsia-600">2026</span>
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-900 dark:text-slate-100">
            Enter<span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-rose-600 to-fuchsia-600">ed</span>
            </span>{" "}
            med school already? Cool! Use our website for study material during med school, check the latest events, study materials, and updates from your classmates, gather XP together, compete against other schools, solve clinical cases together — and much more!
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-slate-900 dark:text-slate-100">
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500"/> Course Mates hub with events, notes, and live feed</li>
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-indigo-500"/> XP, weekly leaderboards, and school vs. school challenges</li>
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-fuchsia-500"/> Clinical cases, sprints, and quiz nights</li>
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/course-mates" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500">Try the Hub</Link>
            <Link href="/updates" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-indigo-200">See all 2026 updates</Link>
          </div>

          {/* Floating NEW badges */}
          <div className="mt-6 flex flex-wrap gap-2 opacity-80">{news}</div>
        </div>

        {/* Right widget */}
        <div className="relative">
          <div className="pointer-events-none absolute -top-6 -right-6 -left-6 h-10 rounded-[32px] bg-[radial-gradient(140px_20px_at_50%_0%,rgba(99,102,241,0.08),transparent)]" />
          <CourseMatesWidget />
        </div>
      </div>
    </section>
  );
}
