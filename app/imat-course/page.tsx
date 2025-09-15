import type { Metadata } from "next";
import HomeVibrantBackdrop from "@/components/home/HomeVibrantBackdrop";
import VibrantSectionStyles from "@/components/home/VibrantSectionStyles";
import ShimmerHeading from "@/components/ui/ShimmerHeading";
import Reveal from "@/components/imat/Reveal";
import StickyCTA from "@/components/imat/StickyCTA";
import { AnalyzerDemo, DifficultyKnob, PlannerDemo, PrimerGrid, QuestionLabDemo } from "@/components/imat/InteractiveDemos";

export const metadata: Metadata = {
  title: "IMAT Course | EnterMedSchool",
  description:
    "A playful, guided IMAT prep experience: plan, practice and refine with interactive demos and a clear, map‑first flow.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
};

// Tiny content helpers
const HERO_POINTS = [
  ["Plan", "8‑week flow"],
  ["Practice", "Timed Qs"],
  ["Refine", "Real tricks"],
  ["Support", "Ask & fix"],
] as const;

const PLANS = [
  {
    tag: "0 → 100",
    name: "Full IMAT Online Course",
    price: "€699",
    oldPrice: "€899",
    note: "Early discount active",
    cta: "Start Studying Today",
    highlight: true,
    features: [
      "Guided 8‑week planner",
      "Past‑paper strategy",
      "IMAT‑style drills",
      "Math & physics primer",
      "Question marathons",
      "Student‑only platform",
    ],
  },
  {
    tag: "Crunch Time",
    name: "IMAT Last‑Minute Sprint",
    price: "€699",
    oldPrice: "€999",
    note: "Includes live sessions",
    cta: "Join Sprint",
    features: [
      "10 live crash blocks",
      "Marathon practice",
      "Printed paper tactics",
      "Strategy refreshers",
      "Retake guarantee",
      "Lowest price promise",
    ],
  },
  {
    tag: "Coaching",
    name: "1‑on‑1 with Ari (Waitlist)",
    price: "€2099",
    oldPrice: "€3999",
    note: "Summer intake",
    cta: "Join Waitlist",
    features: [
      "Custom planner",
      "Progress reviews",
      "Targeted homework",
      "Advanced timing",
      "Deep dive blocks",
      "Priority Q&A",
    ],
  },
] as const;

const FAQ = [
  { q: "Will this cover everything?", a: "Yes — strategy, content, timed drills and review." },
  { q: "What makes it different?", a: "A guided plan and constant iteration based on student feedback." },
  { q: "Do I need a background in math/physics?", a: "No — the primer starts from zero with short, focused steps." },
  { q: "Can I retake for free?", a: "Yes — if you don’t pass, you get another year of access." },
  { q: "Payment plans?", a: "Yes — reach out and we’ll set up installments." },
] as const;

// --------- Small UI helpers ---------
function CTAButtons() {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <a href="#pricing" className="btn-primary-shine">Start Studying Today</a>
      <a href="#demos" className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur hover:bg-white/15">Try Demos</a>
    </div>
  );
}
function PriceCard({ p }: { p: (typeof PLANS)[number] }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md ${
        ("highlight" in p && (p as any).highlight) ? "border-transparent bg-gradient-to-b from-sky-50 to-white p-[1.5px]" : "border-slate-200"
      }`}
    >
      {("highlight" in p && (p as any).highlight) && (
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-sky-200 to-indigo-200" />
      )}
      <div className={`absolute -top-3 left-4 rounded-full px-3 py-1 text-[11px] font-semibold ${("highlight" in p && (p as any).highlight) ? "bg-indigo-600 text-white" : "bg-sky-600 text-white"}`}>
        {p.tag}
      </div>
      <h3 className="mt-1 pr-10 text-lg font-bold text-slate-900">{p.name}</h3>
      <div className="mt-3 flex items-baseline gap-3">
        {p.oldPrice ? <div className="text-lg font-semibold text-slate-400 line-through">{p.oldPrice}</div> : null}
        <div className="text-3xl font-extrabold text-slate-900">{p.price}</div>
      </div>
      {p.note ? <p className="mt-1 text-xs font-semibold text-emerald-700">{p.note}</p> : null}
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {p.features.map((f, j) => (
          <li key={j} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-indigo-500" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <a href="#" className="mt-5 btn-primary-shine">{p.cta}</a>
    </div>
  );
}

// --------- Page ---------
export default function IMATCoursePage() {
  return (
    <div className="space-y-20">
      <HomeVibrantBackdrop />
      <StickyCTA />
      {/* 1) Hero: shimmer + interactive knob */}
      <section className="vbg vbg-blue relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden rounded-b-[36px] shadow-[0_16px_40px_rgba(49,46,129,0.12)]">
        <div className="mx-auto grid min-h-[60vh] w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2">
          <div>
            <ShimmerHeading pretitle="IMAT 2025" title={"Choose. Prepare. Pass."} variant="electric" size="lg" />
            <Reveal>
              <p className="mt-4 max-w-xl text-white/90">
                A playful, guided prep that feels like progress. Slide difficulty, toggle a weekly plan, and try a question — no sign‑up required.
              </p>
            </Reveal>
            <Reveal><CTAButtons /></Reveal>
            <Reveal delay={0.06}>
              <div className="mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                {HERO_POINTS.map(([a, b], i) => (
                  <div key={i} className="rounded-xl bg-white/90 px-3 py-2 text-center shadow-sm ring-1 ring-slate-200">
                    <div className="text-xs font-extrabold text-slate-900">{a}</div>
                    <div className="text-[10px] font-bold text-slate-600">{b}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
          <div>
            <Reveal><DifficultyKnob /></Reveal>
          </div>
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      {/* 2) Planner vs copy (alternating) */}
      <section id="demos" className="vbg vbg-emerald relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-14">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <Reveal><PlannerDemo /></Reveal>
          </div>
          <div className="order-1 md:order-2">
            <Reveal>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-700">Guided Flow</div>
              <h2 className="font-[var(--font-baloo,_inherit)] text-3xl font-extrabold text-slate-900">An 8‑Week Plan That Adapts</h2>
              <p className="mt-2 text-slate-700">Tap through the weeks. Each one balances learning, practice and review with lightweight checkpoints.</p>
            </Reveal>
          </div>
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      {/* 3) Question lab (alternating) */}
      <section className="vbg vbg-amber relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-14">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2">
          <div>
            <Reveal>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-700">Practice</div>
              <h2 className="font-[var(--font-baloo,_inherit)] text-3xl font-extrabold text-slate-900">Rapid Question Checks</h2>
              <p className="mt-2 text-slate-700">Get instant feedback with tiny IMAT‑style prompts. Learn the trick, then move on.</p>
            </Reveal>
          </div>
          <div>
            <Reveal><QuestionLabDemo /></Reveal>
          </div>
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      {/* 4) Analyzer (alternating back) */}
      <section className="vbg vbg-violet relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-14">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <Reveal><AnalyzerDemo /></Reveal>
          </div>
          <div className="order-1 md:order-2">
            <Reveal>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-violet-700">Strategy</div>
              <h2 className="font-[var(--font-baloo,_inherit)] text-3xl font-extrabold text-slate-900">Past‑Paper Analyzer</h2>
              <p className="mt-2 text-slate-700">Slide through the phases: scan, eliminate, compute lightly, then lock answers on a final pass.</p>
            </Reveal>
          </div>
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      {/* 5) Primer grid (alternating) */}
      <section className="vbg vbg-blue relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-14">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2">
          <div>
            <Reveal>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-700">Foundations</div>
              <h2 className="font-[var(--font-baloo,_inherit)] text-3xl font-extrabold text-slate-900">Math & Physics Primer</h2>
              <p className="mt-2 text-slate-700">Mark topics as confident. Short, focused videos build up from zero, no prior background needed.</p>
            </Reveal>
          </div>
          <div>
            <Reveal><PrimerGrid /></Reveal>
          </div>
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      {/* 6) Pricing (clean) */}
      <section id="pricing" className="vbg vbg-emerald relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-14">
        <div className="mx-auto w-full max-w-6xl px-6">
          <Reveal>
            <h2 className="mb-6 text-center font-[var(--font-baloo,_inherit)] text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Course Enrollment
            </h2>
          </Reveal>
          <Reveal delay={0.04} className="grid gap-6 md:grid-cols-3">
            {PLANS.map((p, i) => (
              <PriceCard key={i} p={p} />
            ))}
          </Reveal>
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      {/* 7) FAQ */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="font-[var(--font-baloo,_inherit)] text-2xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="mt-2 text-slate-600">Have another question? Email contact@arihoresh.com or WhatsApp +39 375 612 311.</p>
          </div>
          <div className="md:col-span-2">
            <div className="space-y-3">
              {FAQ.map((item, idx) => (
                <details key={idx} className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm open:glow-ring">
                  <summary className="cursor-pointer list-none font-medium text-slate-900">
                    <span className="mr-2 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">FAQ</span>
                    {item.q}
                  </summary>
                  <p className="mt-2 text-slate-700">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vibrant helpers */}
      <VibrantSectionStyles />
    </div>
  );
}
