import Image from "next/image";
import type { Metadata } from "next";
import HomeVibrantBackdrop from "@/components/home/HomeVibrantBackdrop";
import VibrantSectionStyles from "@/components/home/VibrantSectionStyles";
import ShimmerHeading from "@/components/ui/ShimmerHeading";
import Reveal from "@/components/imat/Reveal";
import StickyCTA from "@/components/imat/StickyCTA";

export const metadata: Metadata = {
  title: "IMAT Course | EnterMedSchool",
  description:
    "Ace the IMAT with a guided plan, 200+ hours of focused lessons, past-paper strategy, and 2,600+ math & physics videos.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
};

// --------- Content (reusing your existing photos) ---------
const HERO_STATS = [
  { k: "200+", v: "Hours of Content" },
  { k: "300+", v: "Past-Paper Analyses" },
  { k: "2,600+", v: "Math & Physics Videos" },
  { k: "30+", v: "Hours of Marathons" },
] as const;

type Tile = {
  title: string;
  body: string;
  image: string;
  alt: string;
  accent: "indigo" | "emerald" | "violet" | "amber" | "sky" | "fuchsia";
};

const BENTO: Tile[] = [
  {
    title: "Start-to-finish clarity",
    body: "Short, focused videos + a clear plan to follow.",
    image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-22.png",
    alt: "IMAT course devices",
    accent: "indigo",
  },
  {
    title: "Real exam strategy",
    body: "Printed past papers, timed, explained under pressure.",
    image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-23.png",
    alt: "Past paper analysis",
    accent: "emerald",
  },
  {
    title: "Math & Physics, from zero",
    body: "2,600+ bite-size videos build foundations quickly.",
    image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-27.png",
    alt: "Math physics lesson",
    accent: "violet",
  },
  {
    title: "Advanced live blocks",
    body: "Intense summer sessions sharpen timing and intuition.",
    image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-26.png",
    alt: "Live class setup",
    accent: "amber",
  },
  {
    title: "Ask, get unstuck",
    body: "Student-only platform with direct guidance and archives.",
    image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/06/Untitled-design-10.png",
    alt: "Student platform",
    accent: "sky",
  },
  {
    title: "1-on-1 coaching",
    body: "Plan, diagnose weak spots, and move fast with Ari.",
    image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-28.png",
    alt: "Coaching session",
    accent: "fuchsia",
  },
];

const VIDEO_TESTIMONIALS = [
  { url: "https://www.youtube.com/embed/cM4qJmzAGzA", label: "Top 0.7%" },
  { url: "https://www.youtube.com/embed/vCHf00ACxjE", label: "Top 1.5%" },
  { url: "https://www.youtube.com/embed/2kD5e_JUCck", label: "Top 0.4%" },
] as const;

const REVIEW_IMAGES = [
  "https://entermedschool.com/wp-content/uploads/2024/06/review1-298x300.png",
  "https://entermedschool.com/wp-content/uploads/2024/06/review2-300x296.png",
  "https://entermedschool.com/wp-content/uploads/2024/06/review3-264x300.png",
  "https://entermedschool.com/wp-content/uploads/2024/06/review4-268x300.png",
  "https://entermedschool.com/wp-content/uploads/2024/06/review5-300x166.png",
  "https://entermedschool.com/wp-content/uploads/2024/06/review6-300x156.png",
  "https://entermedschool.com/wp-content/uploads/2024/06/review7-300x156.png",
  "https://entermedschool.com/wp-content/uploads/2024/06/review8-300x178.png",
  "https://entermedschool.com/wp-content/uploads/2024/06/review13-300x263.png",
  "https://entermedschool.com/wp-content/uploads/2024/06/review12-300x207.png",
  "https://entermedschool.com/wp-content/uploads/2024/06/review11-300x177.png",
  "https://entermedschool.com/wp-content/uploads/2024/06/review10-300x170.png",
  "https://entermedschool.com/wp-content/uploads/2024/06/review9-300x191.png",
];

type Plan = {
  tag: string;
  name: string;
  price: string;
  oldPrice?: string;
  note?: string;
  cta: string;
  highlight?: boolean;
  waitlist?: boolean;
  soldOut?: boolean;
  features: string[];
};

const PLANS: Plan[] = [
  {
    tag: "Incredible Value",
    name:
      "IMAT 2025 Last Minute Online Course + BONUS: 2 WEEKS of Live Question-Solving Sessions During September",
    price: "€699",
    oldPrice: "€999",
    note: "Use 'LASTPUSH30' for 30% OFF",
    cta: "Join Last Minute Crash Course",
    features: [
      "200+ Hours of Content",
      "30+ Hours of Practice Marathons",
      "200+ IMAT‑Styled Questions",
      "300+ Hands-on Analysis Videos",
      "Student-only Platform",
      "Archive of All Past Student Questions",
      "NEW: 2,600+ Math and Physics Videos",
      "Critical Thinking Crash Course",
      "Analyzing Past IMAT Tricks Playlist",
      "Complete 8‑Week Study Planner",
      "Free Retake Pass Guarantee!",
      "Lowest Price Guarantee",
      "2‑Weeks Intensive Marathon: 10 Live Classes starting 2 Weeks Before IMAT 2025",
      "Recordings of both 2023 and 2024 Live Zoom Summer Classes",
    ],
  },
  {
    tag: "0 to 100 Solution",
    name: "Full IMAT 2026 Online Course + 4 WEEKS of Live Question-Solving Sessions",
    price: "€699",
    oldPrice: "€899",
    note: "Use 'IAMEARLY200' To Get 200 EUR Discount",
    cta: "Start Studying Today",
    highlight: true,
    features: [
      "200+ Hours of Content",
      "4 Weeks of Live Practice Sessions",
      "300+ Hands-on Analysis Videos",
      "5000+ IMAT‑Styled Questions (Yes, not a typo)",
      "Student-only Platform",
      "Archive of All Past Student Questions",
      "NEW: 2,600+ Math and Physics Videos",
      "Analyzing Past IMAT Tricks Playlist",
      "New 2026 60 Days Planner",
      "Lowest Price Guarantee",
      "Recordings of the 2023‑2025 Live Zoom Summer Classes (2099 EUR)",
      "Free Retake Pass Guarantee!",
    ],
  },
  {
    tag: "Next Year Summer Intake",
    name: "Live Zoom Summer 2026 Bootcamp — 3 Months of Intensive Classes",
    price: "€2099",
    oldPrice: "€3999",
    note: "Half the Price of Other Prep Courses",
    cta: "Enroll Today — Waiting List",
    waitlist: true,
    features: [
      "Everything in 'Full Online Course Access', and also:",
      "Everything in '1‑on‑1 Coaching with Ari'",
      "4 Sessions Per Week During the Entire Summer",
      "Classes and Questions Based on Students' Requests",
      "New IMAT‑Style Question Marathons — Based on IMAT 2024",
      "Ideal for deepening understanding and timing",
      "Dissect advanced content and challenge yourself",
      "Lowest Price Guarantee",
      "The most demanding and comprehensive live course on the market",
    ],
  },
];

const FAQ = [
  {
    q: "Will the course fully prepare me for the exam?",
    a: "Yes. It covers strategy, content, and timed practice with exam‑style questions and past paper analysis.",
  },
  { q: "What makes this course different?", a: "A clear plan, constantly updated lessons, and personal guidance." },
  { q: "Does it work for other exams?", a: "Many concepts transfer, but the course is optimized for IMAT." },
  {
    q: "What’s the refund policy?",
    a: "We aim for satisfaction; reach out and we’ll do our best to help. Pass‑guarantee offers extended access under set conditions.",
  },
  {
    q: "Can I retake the online course for free if I don’t pass?",
    a: "Yes — students who used the course but didn’t pass get another year of access for free.",
  },
  { q: "Do you offer a payment plan?", a: "Contact us to discuss installment options." },
  { q: "How long is access?", a: "Full access for the exam cycle, with extensions for returning students." },
];

// --------- Small UI helpers ---------
function CTAButtons() {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <a href="#pricing" className="btn-primary-shine">Start Studying Today</a>
      <a
        href="#highlights"
        className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur hover:bg-white/15"
      >
        Explore Highlights
      </a>
    </div>
  );
}

function StatChip({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/90 px-3 py-2 text-slate-800 shadow-sm ring-1 ring-slate-200">
      <div className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-1 text-lg font-extrabold text-white shadow-sm">
        {k}
      </div>
      <div className="text-xs font-semibold text-slate-700">{v}</div>
    </div>
  );
}

function BentoCard({ t }: { t: Tile }) {
  const ring =
    t.accent === "indigo"
      ? "from-indigo-400 to-sky-300"
      : t.accent === "emerald"
      ? "from-emerald-400 to-teal-300"
      : t.accent === "violet"
      ? "from-violet-400 to-fuchsia-300"
      : t.accent === "amber"
      ? "from-amber-400 to-rose-300"
      : t.accent === "sky"
      ? "from-sky-400 to-cyan-300"
      : "from-fuchsia-400 to-pink-300";
  return (
    <div className="group relative">
      <div className={`absolute -inset-[1.5px] rounded-2xl bg-gradient-to-r ${ring} opacity-60 blur-[6px] transition-opacity group-hover:opacity-90`} />
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="relative h-44 w-full sm:h-48">
          <Image
            src={t.image}
            alt={t.alt}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] group-hover:rotate-[0.4deg]"
          />
        </div>
        <div className="p-4">
          <div className="text-sm font-extrabold tracking-tight text-slate-900">{t.title}</div>
          <div className="mt-1 text-sm text-slate-600">{t.body}</div>
        </div>
      </div>
    </div>
  );
}

function PriceCard({ p }: { p: Plan }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md ${
        p.highlight ? "border-transparent bg-gradient-to-b from-sky-50 to-white p-[1.5px]" : "border-slate-200"
      }`}
    >
      {p.highlight && (
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-sky-200 to-indigo-200" />
      )}
      <div className={`absolute -top-3 left-4 rounded-full px-3 py-1 text-[11px] font-semibold ${p.highlight ? "bg-indigo-600 text-white" : "bg-sky-600 text-white"}`}>
        {p.tag}
      </div>
      <h3 className="mt-1 pr-10 text-lg font-bold text-slate-900">{p.name}</h3>
      <div className="mt-3 flex items-baseline gap-3">
        {p.oldPrice ? (
          <div className="text-lg font-semibold text-slate-400 line-through">{p.oldPrice}</div>
        ) : null}
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

      {/* Hero: full-bleed, vibrant, shimmering */}
      <section className="vbg vbg-blue relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden rounded-b-[36px] shadow-[0_16px_40px_rgba(49,46,129,0.12)]">
        <div className="relative mx-auto flex min-h-[60vh] w-full max-w-6xl flex-col items-start justify-center gap-6 px-6 py-16">
          <ShimmerHeading pretitle="IMAT Course 2025" title={"Choose. Prepare. Pass."} variant="electric" size="lg" />
          <Reveal>
            <p className="max-w-2xl text-white/90">
              A map-first plan to ace the IMAT. 200+ focused hours, real past-paper strategy, and 2,600+ math & physics
              videos — all guided, so you always know what to do next.
            </p>
          </Reveal>
          <Reveal><CTAButtons /></Reveal>
          <Reveal delay={0.06}>
            <div className="mt-4 grid w-full grid-cols-2 gap-3 sm:max-w-3xl md:grid-cols-4">
              {HERO_STATS.map((s, i) => (
                <StatChip key={i} k={s.k} v={s.v} />
              ))}
            </div>
          </Reveal>
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      {/* Highlights: Bento feature grid */}
      <section id="highlights" className="vbg vbg-emerald relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-12">
        <div className="mx-auto w-full max-w-6xl px-6">
          <Reveal>
            <div className="mb-6">
              <ShimmerHeading pretitle="Course Highlights" title={"Everything You Need, In One Flow"} variant="teal" size="md" />
            </div>
          </Reveal>
          <Reveal delay={0.04}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {BENTO.map((t, i) => (
                <BentoCard key={i} t={t} />
              ))}
            </div>
          </Reveal>
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      {/* Student videos */}
      <section className="vbg vbg-violet relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-12">
        <div className="mx-auto w-full max-w-6xl px-6">
          <Reveal>
            <h2 className="mb-6 text-center font-[var(--font-baloo,_inherit)] text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Real Results, Real Voices
            </h2>
          </Reveal>
          <Reveal delay={0.04} className="grid gap-6 md:grid-cols-3">
            {VIDEO_TESTIMONIALS.map((v, i) => (
              <div key={i} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <div className="relative aspect-video overflow-hidden rounded-xl">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={v.url}
                    title="Student video testimonial"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="mt-2 inline-block rounded-md bg-yellow-300 px-2 py-1 text-xs font-bold text-slate-900">
                  {v.label}
                </div>
              </div>
            ))}
          </Reveal>
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      {/* Pricing */}
      <section id="pricing" className="vbg vbg-emerald relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-12">
        <div className="mx-auto w-full max-w-6xl px-6">
          <Reveal>
            <h2 className="mb-6 text-center font-[var(--font-baloo,_inherit)] text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Course Enrollment — Join the Club
            </h2>
          </Reveal>

          <Reveal delay={0.04} className="grid gap-6 md:grid-cols-3">
            {PLANS.map((p, i) => (
              <PriceCard key={i} p={p} />
            ))}
          </Reveal>

          <Reveal delay={0.06}>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {REVIEW_IMAGES.slice(0, 6).map((src, i) => (
                <div key={i} className="overflow-hidden rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
                  <Image src={src} alt="Student review screenshot" width={600} height={600} className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      {/* FAQ */}
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

