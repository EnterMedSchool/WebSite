"use client";

import React from "react";

type FeatureTestimonial = {
  id: string;
  name: string;
  role: string;
  lead: string;
  quote: string[];
  accent: "indigo" | "violet" | "teal" | "emerald" | "amber";
};

type SupportTestimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
  accent?: "indigo" | "violet" | "teal" | "emerald" | "amber" | "rose" | "sky" | "slate";
};

const FEATURED: FeatureTestimonial[] = [
  {
    id: "ujjwal-spotlight",
    name: "Ujjwal Ujjain",
    role: "University of Pavia - 3rd Year",
    lead:
      "I wholeheartedly recommend EnterMedSchool to future aspirants who are unsure where to start.",
    quote: [
      "I used EnterMedSchool for my IMAT preparation, and it was a wonderful experience that helped me secure a place at the university of my choice.",
      "We had comprehensive summaries for all the high-yield topics that have been tested in past exams.",
      "The aspect that fascinated me most was Ari's walkthrough of past papers, explaining how to approach each question type with tips and tricks that saved precious time on exam day.",
      "Support went beyond academics too; Ari regularly boosted our morale and confidence, so the journey never felt lonely.",
    ],
    accent: "indigo",
  },
  {
    id: "diana-spotlight",
    name: "Diana Nicolae",
    role: "Ari's Past Student",
    lead: "My experience with EnterMedSchool has been and still is exceptional.",
    quote: [
      "The team is incredibly helpful and communicative, but most of all they genuinely care about future medical students.",
      "Big exams come with discipline, stress, anxiety, and the fear of failing. The guidance I received covered everything from study techniques and materials to regulating the pressure.",
      "They offer free consultations and even scholarships for students facing financial difficulties, so you never feel alone in the journey.",
      "You are surrounded by people just like you who share concerns, and there is always someone ready to help.",
    ],
    accent: "violet",
  },
  {
    id: "katerina-spotlight",
    name: "Katerina Fisher",
    role: "University of Pavia",
    lead: "The EnterMedSchool team was always responsive and kind with every interaction.",
    quote: [
      "Issues were resolved quickly and efficiently, which made an enormous difference while preparing for the IMAT.",
      "They build systems with precision, from resources to community and support, all delivered with care and a commitment to students' success.",
      "It truly feels like a gold-standard experience, and I look forward to continuing with EnterMedSchool.",
    ],
    accent: "teal",
  },
  {
    id: "darius-spotlight",
    name: "Darius Duhan",
    role: "University of Pavia",
    lead:
      "I gained deeper knowledge across the high-yield topics and met an amazing community of like-minded students.",
    quote: [
      "The course helped me tackle difficult concepts in the IMAT specification and gave me peers who constantly helped each other grow.",
      "I will keep spreading the word so more prospective medical students can join this project and benefit from everything Ari and the team have built.",
    ],
    accent: "emerald",
  },
  {
    id: "khine-spotlight",
    name: "Khine Su Wai (Stella)",
    role: "University of Turin - 1st Year",
    lead:
      "Ari and his team are super talented, and their materials made my IMAT preparation far more effective.",
    quote: [
      "Taking EnterMedSchool's course gave me confidence because every lesson was designed specifically for the exam.",
      "The community is warm and supportive, and I strongly recommend the course to anyone aiming for medical school in Italy.",
    ],
    accent: "amber",
  },
];

const SUPPORTING: SupportTestimonial[] = [
  {
    id: "ortal-hagai",
    name: "Ortal or Hagai",
    role: "Ari's Past Student",
    quote:
      "I think that the EnterMedSchool platform deserves great exposure and appreciation. Ari's EMS platform is unique because it teaches students to help each other.",
    accent: "rose",
  },
  {
    id: "larissa",
    name: "Larissa Domeneck",
    role: "Ari's Past Student",
    quote:
      "Ari was really helpful and gave specific advice for each person's situation. It was great to review our study methods and next steps together.",
    accent: "violet",
  },
  {
    id: "hanin",
    name: "Hanin Almamri",
    role: "IMAT Candidate",
    quote:
      "This course is unreal and Dr. Ari is always considerate of everyone's situation. His books are extremely helpful, even beyond the IMAT.",
    accent: "amber",
  },
  {
    id: "shahar",
    name: "Shahar Siso",
    role: "Community Member",
    quote:
      "The website that Ari Horesh and his team built is absolutely amazing. I've seen so much effort and free professional study material released for everyone.",
    accent: "sky",
  },
  {
    id: "cole",
    name: "Cole Faulkner",
    role: "Past Student - Studying in Italy",
    quote:
      "When I first heard about medical school in Italy I had no idea where to begin. EnterMedSchool made the dream possible because they truly cared about our success.",
    accent: "teal",
  },
  {
    id: "anita",
    name: "Anita Shams",
    role: "Community Member",
    quote:
      "Excellent and so helpful. I am very grateful for the service, and I can't believe it's free. Without it I would be so lost.",
    accent: "emerald",
  },
  {
    id: "palak",
    name: "Palak",
    role: "IMAT Aspirant",
    quote:
      "The quality of the free books is so good. EnterMedSchool gives you exactly the knowledge you need and keeps you motivated every day.",
    accent: "indigo",
  },
  {
    id: "ido",
    name: "Ido Hagai",
    role: "Trustpilot Review",
    quote:
      "This project lets students start learning material that would normally cost thousands, for free. Ari takes time for personal calls, answers every question, and inspires us to believe we can succeed.",
    accent: "slate",
  },
  {
    id: "katerina-short",
    name: "Katerina Fisher",
    role: "University of Pavia",
    quote:
      "The EnterMedSchool team was always responsive and helpful, resolving every issue with efficiency and kindness.",
    accent: "teal",
  },
  {
    id: "ujjwal-short",
    name: "Ujjwal Ujjain",
    role: "University of Pavia - 3rd Year",
    quote:
      "I wholeheartedly recommend EnterMedSchool to future aspirants who are confused about where to start their IMAT journey.",
    accent: "indigo",
  },
  {
    id: "diana-short",
    name: "Diana Nicolae",
    role: "Ari's Past Student",
    quote:
      "The team is very helpful, communicative, and genuinely concerned for future medical students.",
    accent: "violet",
  },
  {
    id: "darius-short",
    name: "Darius Duhan",
    role: "University of Pavia",
    quote:
      "I met an amazing community of like-minded students who work hard to help each other grow.",
    accent: "emerald",
  },
  {
    id: "khine-short",
    name: "Khine Su Wai (Stella)",
    role: "University of Turin - 1st Year",
    quote:
      "I gained confidence and security by revising with the lessons the EnterMedSchool team provided.",
    accent: "amber",
  },
];

export default function ReviewsSection() {
  return (
    <section className="reviews" aria-labelledby="reviews-heading">
      <div className="rev-head">
        <p className="kicker">Student Stories</p>
        <h3 id="reviews-heading" className="title">What Learners Say</h3>
        <p className="sub">
          Real notes from IMAT candidates and EnterMedSchool alumni about the support, resources, and community that helped them get in.
        </p>
      </div>

      <div className="features">
        {FEATURED.map((item) => (
          <article key={item.id} className={`feature accent-${item.accent}`}>
            <div className="spark" aria-hidden>
              <span />
              <span />
            </div>
            <p className="lead">{item.lead}</p>
            <blockquote>
              {item.quote.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </blockquote>
            <footer>
              <div className="avatar" aria-hidden>{item.name.charAt(0)}</div>
              <div className="meta">
                <span className="name">{item.name}</span>
                <span className="role">{item.role}</span>
              </div>
            </footer>
          </article>
        ))}
      </div>

      <div className="support">
        {SUPPORTING.map((item) => (
          <article key={item.id} className={`tile accent-${item.accent ?? "slate"}`}>
            <div className="tile-highlight" aria-hidden />
            <p className="quote">{item.quote}</p>
            <footer>
              <div className="avatar" aria-hidden>{item.name.charAt(0)}</div>
              <div className="meta">
                <span className="name">{item.name}</span>
                <span className="role">{item.role}</span>
              </div>
            </footer>
          </article>
        ))}
      </div>

      <style jsx>{`
        .reviews { position: relative; }
        .rev-head { text-align: center; margin-bottom: 28px; }
        .kicker { color: #0f172a; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; font-size: 12px; }
        .title { margin: 8px 0 10px; font-size: clamp(24px, 5vw, 40px); font-weight: 900; color: #0f172a; }
        .sub { color: #1e293b; max-width: 66ch; margin: 0 auto; font-size: 15px; }

        .features { display: grid; gap: 20px; margin: 0 auto 32px; max-width: 1120px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        .feature { position: relative; overflow: hidden; border-radius: 28px; padding: clamp(20px, 4vw, 32px); color: #f8fafc; background: linear-gradient(135deg, var(--accent-a), var(--accent-b)); box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22); border: 1px solid rgba(255, 255, 255, 0.25); display: flex; flex-direction: column; gap: 16px; min-height: 280px; }
        .feature::after { content: ""; position: absolute; inset: 0; background: radial-gradient(60% 60% at 50% 0%, rgba(255,255,255,0.18), transparent 70%); mix-blend-mode: screen; opacity: 0.8; pointer-events: none; }
        .feature .spark { position: absolute; inset: 0; pointer-events: none; }
        .feature .spark span:first-child { position: absolute; top: -40px; right: -40px; width: 140px; height: 140px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.42), transparent 70%); filter: blur(2px); opacity: 0.9; }
        .feature .spark span:last-child { position: absolute; bottom: -36px; left: -24px; width: 160px; height: 160px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%); filter: blur(1px); }
        .feature .lead { font-weight: 800; font-size: clamp(18px, 3vw, 24px); line-height: 1.3; position: relative; z-index: 1; }
        .feature blockquote { position: relative; z-index: 1; display: grid; gap: 10px; font-size: 15px; line-height: 1.55; }
        .feature footer { position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; margin-top: auto; }

        .support { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); max-width: 1120px; margin: 0 auto; }
        .tile { position: relative; border-radius: 22px; padding: 20px; background: rgba(255,255,255,0.92); border: 1px solid rgba(15,23,42,0.08); box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12); display: flex; flex-direction: column; gap: 16px; backdrop-filter: blur(6px); }
        .tile-highlight { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(135deg, var(--accent-a), transparent); opacity: 0.18; }
        .tile .quote { position: relative; z-index: 1; color: #0f172a; font-weight: 600; font-size: 15px; line-height: 1.55; }
        .tile footer { position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; }

        .avatar { width: 36px; height: 36px; border-radius: 9999px; background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.4); display: grid; place-items: center; font-weight: 900; }
        .feature .avatar { background: rgba(15,23,42,0.18); color: #f8fafc; border: 1px solid rgba(255,255,255,0.35); }
        .tile .avatar { background: rgba(15,23,42,0.05); color: #1e293b; border: 1px solid rgba(15,23,42,0.1); }
        .meta { display: flex; flex-direction: column; }
        .meta .name { font-weight: 800; color: inherit; }
        .feature .meta .name { color: #f8fafc; }
        .tile .meta .name { color: #0f172a; }
        .meta .role { font-size: 12px; font-weight: 600; opacity: 0.85; }
        .feature .meta .role { color: rgba(248,250,252,0.85); }
        .tile .meta .role { color: #475569; }

        .accent-indigo { --accent-a: #6366f1; --accent-b: #22d3ee; }
        .accent-violet { --accent-a: #a855f7; --accent-b: #ec4899; }
        .accent-teal { --accent-a: #0ea5e9; --accent-b: #14b8a6; }
        .accent-emerald { --accent-a: #059669; --accent-b: #34d399; }
        .accent-amber { --accent-a: #f59e0b; --accent-b: #f97316; }
        .accent-rose { --accent-a: #fb7185; --accent-b: #f472b6; }
        .accent-sky { --accent-a: #38bdf8; --accent-b: #818cf8; }
        .accent-slate { --accent-a: #475569; --accent-b: #1f2937; }

        @media (max-width: 768px) {
          .features { display: flex; overflow-x: auto; gap: 16px; padding: 4px 4px 12px; scroll-snap-type: x mandatory; }
          .feature { min-width: 82%; scroll-snap-align: start; }
        }

        @media (max-width: 640px) {
          .sub { font-size: 14px; }
          .tile { padding: 18px; }
        }
      `}</style>
    </section>
  );
}
