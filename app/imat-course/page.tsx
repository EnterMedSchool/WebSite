import Image from "next/image";
import type { Metadata } from "next";
import HomeBackdrop from "@/components/home/HomeBackdrop";
import Reveal from "@/components/imat/Reveal";
import StickyCTA from "@/components/imat/StickyCTA";

export const metadata: Metadata = {
  title: "IMAT Course | EnterMedSchool",
  description: "Ace the IMAT with 200+ hours of lessons, past paper analysis, question marathons, math & physics from the basics, and more.",
  // Extra safety: page-level noindex (sitewide is also disabled via headers/robots)
  robots: { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
};

type Feature = {
  eyebrow?: string;
  title: string;
  bullets: string[];
  image: string;
  imageAlt: string;
  reverse?: boolean;
};

const FEATURES: Feature[] = [
  {
    eyebrow: "Everything you need from start to finish",
    title: "Ace the IMAT with 200+ Hours of Videos and Practice Questions",
    bullets: [
      "Short, focused videos that teach exam strategy and core concepts.",
      "500+ pages of notes and summaries to review efficiently.",
      "Continuously updated based on student feedback since 2021.",
    ],
    image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-22.png",
    imageAlt: "IMAT course preview on laptop and tablet",
  },
  {
    eyebrow: "Focus on exam strategy and time management",
    title: "Detailed Analysis of Actual Printed Past Papers",
    bullets: [
      "300+ hands‑on analysis videos under realistic exam conditions.",
      "200+ bonus questions similar to the new IMAT format.",
      "Question‑solving marathons for the final weeks before the exam.",
    ],
    image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-23.png",
    imageAlt: "Past paper analysis on desk",
    reverse: true,
  },
  {
    eyebrow: "Get your questions answered",
    title: "Student‑only Platform To Guide You Every Step of the Way",
    bullets: [
      "Archive of previously asked questions to learn from real cases.",
      "Direct support to identify weak spots and fix them fast.",
      "Clear takeaways so you always know what to focus on next.",
    ],
    image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/06/Untitled-design-10.png",
    imageAlt: "EnterMedSchool student platform screenshot",
  },
  {
    eyebrow: "New: Math and Physics from the very basics",
    title: "Learn Math and Physics Even Without Any Background",
    bullets: [
      "2,600+ bite‑size videos arranged in a logical sequence.",
      "Exam‑oriented summaries based on past papers.",
      "Turn weaknesses into strengths with targeted drills.",
    ],
    image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-27.png",
    imageAlt: "Math and physics lesson on tablet",
    reverse: true,
  },
  {
    eyebrow: "For those who aim high and appreciate structure",
    title: "Live Advanced Zoom Classes Right Before the Exam",
    bullets: [
      "Challenging summer class for high‑yield concepts.",
      "4 sessions per week solving IMAT‑like questions together.",
      "Small group with personal guidance and Q&A.",
    ],
    image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-26.png",
    imageAlt: "Live zoom class setup",
  },
  {
    eyebrow: "Personalized guidance",
    title: "1‑on‑1 Live Coaching Together With Ari Horesh",
    bullets: [
      "Identify your weak spots and build a plan.",
      "Fast feedback and accountability.",
      "Flexible sessions — as many as you need.",
    ],
    image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-28.png",
    imageAlt: "1 on 1 coaching session",
    reverse: true,
  },
];

const SMALL_FEATURES = [
  { title: "8‑Week IMAT Study Planner", image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/06/Untitled-design-14.png" },
  { title: "Critical Thinking Crash Course", image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-32.png" },
  { title: "Bite‑sized IMAT Video Tricks", image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-30.png" },
  { title: "20+ PDFs for Key Calculations", image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/06/Untitled-design-18.png" },
  { title: "120+ Hours Biology & Chemistry", image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-31.png" },
  { title: "30+ Hours of IMAT‑like Questions", image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/06/Untitled-design-20.png" },
];

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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-sky-600">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
      {children}
    </div>
  );
}

function CTAButtons() {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <a href="#pricing" className="btn-primary-shine">Start Studying Today</a>
      <a href="#features" className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur hover:bg-white/15">Learn More</a>
    </div>
  );
}

export default function IMATCoursePage() {
  return (
    <div className="space-y-20">
      <HomeBackdrop />
      <StickyCTA />

      {/* Hero: full-bleed video with gradient overlay */}
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden rounded-b-[36px] shadow-[0_16px_40px_rgba(49,46,129,0.12)]">
        <div className="relative h-[64vh] min-h-[460px] w-full">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="https://entermedschool.b-cdn.net/wp-content/uploads/2024/07/Untitled-design-22.png"
            src="https://entermedschool.com/wp-content/uploads/2024/06/ezgif.com-gif-to-mp4-converter.mp4"
          />
          <div className="absolute inset-0 aurora-bg" />
          {/* Floating orbs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-8 top-10 h-24 w-24 rounded-full bg-sky-400/25 blur-2xl animate-float-slow" />
            <div className="absolute right-16 bottom-12 h-28 w-28 rounded-full bg-indigo-400/25 blur-2xl animate-float-slow" style={{ animationDelay: '1s' }} />
          </div>
          <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center px-6">
            <div className="max-w-2xl text-white">
              <h1 className="font-[var(--font-baloo,_inherit)] text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
                IMAT 2025 Full Online Course
              </h1>
              <p className="mt-4 text-white/90">
                Pass the IMAT and secure your spot in Italian medical schools with EnterMedSchool’s most comprehensive, cost‑effective online course — from start to finish.
              </p>
              <CTAButtons />
              <div className="mt-6 rounded-xl bg-white/10 p-4 text-sm text-white/90 ring-1 ring-inset ring-white/20 backdrop-blur">
                “I wholeheartedly recommend EnterMedSchool to future aspirants. It truly makes a difference.” — Past Student
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="mx-auto -mt-10 w-full max-w-6xl px-4">
        <Reveal className="grid grid-cols-2 gap-3 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 p-4 text-slate-800 shadow-md md:grid-cols-4">
          {[
            ["200+", "Hours of Content"],
            ["300+", "Past-Paper Analyses"],
            ["2600+", "Math & Physics Videos"],
            ["30+", "Hours of IMAT-like Qs"],
          ].map(([k, v], i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="rounded-xl bg-white px-3 py-2 text-2xl font-extrabold text-sky-600 shadow-sm ring-1 ring-slate-200">{k}</div>
              <div className="text-sm font-semibold text-slate-700">{v}</div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <div className="pointer-events-none absolute -top-8 left-1/2 h-10 w-[92%] -translate-x-1/2 rounded-[48px] bg-[radial-gradient(140px_20px_at_50%_0%,rgba(99,102,241,0.10),transparent)]" />
        <div className="grid gap-16">
          {FEATURES.map((f, i) => (
            <article key={i} className={`grid items-center gap-8 md:grid-cols-2 ${f.reverse ? 'md:[&>div:first-child]:order-2' : ''}`}>
              <Reveal>
                {f.eyebrow ? <Eyebrow>{f.eyebrow}</Eyebrow> : null}
                <h2 className="font-[var(--font-baloo,_inherit)] text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  {f.title}
                </h2>
                <ul className="mt-4 space-y-2 text-slate-700">
                  {f.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">{j + 1}</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <a href="#pricing" className="mt-5 inline-block btn-primary-shine">Start Studying Today</a>
              </Reveal>
              <Reveal delay={0.08} className="">
                <div className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative">
                    <Image src={f.image} alt={f.imageAlt} width={1200} height={800} className="h-full w-full transform-gpu object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] group-hover:rotate-[0.8deg]" />
                    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                  </div>
                </div>
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      {/* Small features grid */}
      <section className="mx-auto max-w-6xl px-4">
        <Reveal className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SMALL_FEATURES.map((it, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-md">
              <div className="overflow-hidden rounded-lg">
                <Image src={it.image} alt="" width={900} height={600} className="h-44 w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.04]" />
              </div>
              <div className="px-1 pb-2 pt-3 text-center text-sm font-semibold text-slate-800">{it.title}</div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Student videos */}
      <section className="mx-auto max-w-6xl px-4">
        <h2 className="mb-6 text-center font-[var(--font-baloo,_inherit)] text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Here Is What My Students Have To Say
        </h2>
        <Reveal className="grid gap-6 md:grid-cols-3">
          {[
            { url: "https://www.youtube.com/embed/cM4qJmzAGzA", label: "Top 0.7%" },
            { url: "https://www.youtube.com/embed/vCHf00ACxjE", label: "Top 1.5%" },
            { url: "https://www.youtube.com/embed/2kD5e_JUCck", label: "Top 0.4%" },
          ].map((v, i) => (
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
      </section>

      {/* Pricing (concise) */}
      <section id="pricing" className="mx-auto max-w-6xl px-4">
        <h2 className="mb-6 text-center font-[var(--font-baloo,_inherit)] text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Course Enrollment — Join The Club!
        </h2>
        <Reveal className="grid gap-6 md:grid-cols-3">
          {[
            {
              name: "IMAT 2025 Last Minute Course",
              price: "€699",
              note: "Perfect for quick polishing before IMAT 2025.",
              features: [
                "200+ hours of content",
                "30+ hours of marathons",
                "All IMAT‑style questions",
              ],
            },
            {
              name: "Full IMAT 2026 Online Course + 4 Weeks of Live Sessions",
              price: "€699",
              note: "The complete solution from basics to advanced.",
              features: [
                "200+ hours + 4 weeks live practice",
                "300+ hands‑on analysis videos",
                "New: 2,600+ math & physics videos",
              ],
              highlight: true,
            },
            {
              name: "Live Zoom Summer 2026 Bootcamp (Waiting List)",
              price: "€2099",
              note: "The most demanding and comprehensive live experience.",
              features: [
                "Small class, personal feedback",
                "4 sessions/week during summer",
                "Includes everything in Online Course",
              ],
            },
          ].map((p, i) => (
            <div key={i} className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md ${p.highlight ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'}`}>
              <div className="text-sm font-semibold text-indigo-600">{p.highlight ? 'Most Popular' : '\u00A0'}</div>
              <h3 className="mt-1 text-lg font-bold text-slate-900">{p.name}</h3>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{p.price}</div>
              <p className="mt-2 text-sm text-slate-600">{p.note}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-indigo-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a href="#" className="mt-5 btn-primary-shine">Start Studying Today</a>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Reviews grid (images) */}
      <section className="mx-auto max-w-6xl px-4">
        <h2 className="mb-6 text-center font-[var(--font-baloo,_inherit)] text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Real Reviews From Real Students
        </h2>
        <Reveal className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {REVIEW_IMAGES.map((src, i) => (
            <div key={i} className="overflow-hidden rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
              <Image src={src} alt="Student review screenshot" width={600} height={600} className="h-full w-full object-contain" />
            </div>
          ))}
        </Reveal>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-3xl px-4">
        <Reveal>
        <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-[var(--font-baloo,_inherit)] text-2xl font-extrabold text-slate-900">My Story — How I Built This Course</h2>
          <p className="mt-3 text-slate-700">
            In 2019 I was in the same position you are in now. After passing the exam, I realized the available resources were expensive and incomplete. In 2021 I paused my studies to build an affordable, results‑driven IMAT preparation platform. Since then the course has helped hundreds of students study smarter, avoid common mistakes, and score offers from Italy’s top medical schools.
          </p>
          <p className="mt-3 text-slate-700">
            The program is updated continuously with new videos, past‑paper analysis, strategy breakdowns, and focused review material — so you can prepare with confidence and clarity.
          </p>
        </article>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="font-[var(--font-baloo,_inherit)] text-2xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="mt-2 text-slate-600">Have another question? Email contact@arihoresh.com or message on WhatsApp at +39 375 612 311.</p>
          </div>
          <div className="md:col-span-2">
            <div className="space-y-3">
              {[
                { q: "Will the course fully prepare me for the exam?", a: "Yes. It covers strategy, content, and timed practice with exam‑style questions and past paper analysis." },
                { q: "What makes this course different?", a: "A clear plan, constantly updated lessons, and personal support from someone who has been through the process." },
                { q: "Does it work for other exams?", a: "Many concepts transfer, but the course is optimized for IMAT." },
                { q: "What’s the refund policy?", a: "We aim for satisfaction; reach out and we’ll do our best to help. Pass‑guarantee offers extended access under set conditions." },
                { q: "Can I retake the online course for free if I don’t pass?", a: "Yes — students who used the course but didn’t pass get another year of access for free." },
                { q: "Do you offer a payment plan?", a: "Contact us to discuss installment options." },
                { q: "How long is access?", a: "Full access for the exam cycle, with extensions for returning students." },
              ].map((item, idx) => (
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
    </div>
  );
}
