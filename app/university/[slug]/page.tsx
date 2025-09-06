import { notFound } from "next/navigation";
import { Baloo_2, Montserrat } from "next/font/google";
import { db } from "@/lib/db";
import {
  countries,
  universities,
  universityScores,
  universitySeats,
  universityTestimonials,
  universityMedia,
  universityArticles,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-baloo" });

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function getData(slug: string) {
  try {
    const uniRows = await db
      .select({
        id: universities.id,
        name: universities.name,
        city: universities.city,
        kind: universities.kind,
        lat: universities.lat,
        lng: universities.lng,
        rating: universities.rating,
        logoUrl: universities.logoUrl,
        country: countries.name,
      })
      .from(universities)
      .leftJoin(countries, eq(universities.countryId, countries.id));
    const uni = uniRows.find((u) => slugify(u.name) === slug);
    if (!uni) return null;

    const [scores, seats, testimonials, media, articles] = await Promise.all([
      db.select().from(universityScores).where(eq(universityScores.universityId, uni.id)),
      db.select().from(universitySeats).where(eq(universitySeats.universityId, uni.id)),
      db.select().from(universityTestimonials).where(eq(universityTestimonials.universityId, uni.id)),
      db.select().from(universityMedia).where(eq(universityMedia.universityId, uni.id)),
      db.select().from(universityArticles).where(eq(universityArticles.universityId, uni.id)),
    ]);

    return { uni, scores, seats, testimonials, media, articles };
  } catch (err) {
    // Graceful fallback if DB tables are not present (e.g., first deploy)
    const { demoUniversities } = await import("@/data/universities");
    const all = Object.entries(demoUniversities).flatMap(([country, cities]) =>
      cities.map((c) => ({ country, ...c }))
    );
    // Try to match by slug from demo
    const demo = all.find((u) => slugify(u.uni) === slug);
    if (!demo) return null;
    const uni = {
      id: 0,
      name: demo.uni,
      city: demo.city,
      kind: demo.kind ?? "Public",
      lat: demo.lat,
      lng: demo.lng,
      rating: demo.rating ?? 4.4,
      logoUrl: demo.logo ?? null,
      country: demo.country,
    } as any;

    // Provide sensible placeholder extras for local/dev
    const scores = [
      { universityId: 0, year: 2020, candidateType: "EU", minScore: 39.5 },
      { universityId: 0, year: 2021, candidateType: "EU", minScore: 41.0 },
      { universityId: 0, year: 2022, candidateType: "EU", minScore: 42.2 },
      { universityId: 0, year: 2023, candidateType: "EU", minScore: 43.1 },
      { universityId: 0, year: 2024, candidateType: "EU", minScore: 44.0 },
      { universityId: 0, year: 2020, candidateType: "NonEU", minScore: 48.0 },
      { universityId: 0, year: 2021, candidateType: "NonEU", minScore: 49.5 },
      { universityId: 0, year: 2022, candidateType: "NonEU", minScore: 50.0 },
      { universityId: 0, year: 2023, candidateType: "NonEU", minScore: 51.2 },
      { universityId: 0, year: 2024, candidateType: "NonEU", minScore: 52.0 },
    ];
    const seats = [
      { universityId: 0, year: 2024, candidateType: "EU", seats: 78 },
      { universityId: 0, year: 2024, candidateType: "NonEU", seats: 24 },
    ];
    const testimonials = [
      { id: 1, universityId: 0, author: "Sara G.", quote: "Great community and supportive professors.", rating: 4.6 },
      { id: 2, universityId: 0, author: "Marco P.", quote: "Challenging courses with lots of hands-on practice.", rating: 4.4 },
    ];
    const media = (demo.photos ?? []).slice(0,3).map((url, i) => ({ id: i+1, universityId: 0, type: "image", url, title: "" }));
    const articles = demo.article ? [{ id: 1, universityId: 0, title: demo.article.title, href: "#" }] : [];

    return { uni, scores, seats, testimonials, media, articles };
  }
}

function ScoreChart({ data }: { data: { year: number; candidateType: string; minScore: number }[] }) {
  if (!data?.length) return null;
  const types = Array.from(new Set(data.map(d => d.candidateType)));
  const years = Array.from(new Set(data.map(d => d.year))).sort((a,b)=>a-b);
  const byType: Record<string, { year: number; minScore: number }[]> = {};
  for (const t of types) byType[t] = [];
  for (const y of years) {
    for (const t of types) {
      const p = data.find(d => d.year === y && d.candidateType === t);
      if (p) byType[t].push({ year: y, minScore: p.minScore });
    }
  }

  const w = 520, h = 200, pad = 28;
  const minYear = years[0], maxYear = years[years.length-1];
  const scores = data.map(d=>d.minScore);
  const minS = Math.min(...scores), maxS = Math.max(...scores);
  const x = (yr:number)=> pad + ((yr - minYear) / Math.max(1,(maxYear-minYear))) * (w - pad*2);
  const y = (s:number)=> h - pad - ((s - minS) / Math.max(1,(maxS-minS))) * (h - pad*2);
  const colors = ["#6C63FF", "#F59E0B", "#10B981", "#EF4444"]; // indigo, amber, emerald, red

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <rect x={0} y={0} width={w} height={h} rx={16} fill="#F8FAFF" />
      {/* axes */}
      <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="#CBD5E1" />
      <line x1={pad} y1={pad} x2={pad} y2={h-pad} stroke="#CBD5E1" />
      {years.map((yr,i)=> (
        <text key={yr} x={x(yr)} y={h-8} textAnchor="middle" className="fill-gray-500 text-[10px]">{yr}</text>
      ))}
      {/* series */}
      {types.map((t, ti)=>{
        const pts = byType[t]; if (!pts?.length) return null; const color = colors[ti%colors.length];
        const d = pts.map((p,i)=> `${i?'L':'M'}${x(p.year)},${y(p.minScore)}`).join(' ');
        return (
          <g key={t}>
            <path d={d} fill="none" stroke={color} strokeWidth={2.5} />
            {pts.map((p,i)=> (
              <circle key={i} cx={x(p.year)} cy={y(p.minScore)} r={3.5} fill={color} />
            ))}
          </g>
        );
      })}
      {/* legend */}
      {types.map((t, ti)=> (
        <g key={t} transform={`translate(${pad + ti*130}, ${pad-10})`}>
          <rect width={10} height={10} rx={2} fill={colors[ti%colors.length]} />
          <text x={16} y={9} className="fill-gray-600 text-[11px]">{t}</text>
        </g>
      ))}
    </svg>
  );
}

export default async function UniversityPage({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug);
  if (!data) notFound();
  const { uni, scores, seats, testimonials, media, articles } = data;

  return (
    <section className={`${baloo.variable} mx-auto max-w-6xl p-6`}>
      <div className="flex items-start gap-6">
        {/* Main article area */}
        <article className="flex-1 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            {uni.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={uni.logoUrl} alt={`${uni.name} logo`} className="h-12 w-12 rounded-full object-cover" />
            )}
            <div>
              <h1 className="font-brand text-3xl text-indigo-700" style={{fontFamily: "var(--font-baloo)"}}>{uni.name}</h1>
              <p className="text-sm text-gray-500">{uni.city}, {uni.country} • {uni.kind ?? "Public"}</p>
            </div>
            <div className="ml-auto flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
              <span className="text-sm">Rating</span>
              <span className="font-semibold">{(uni.rating ?? 4.4).toFixed(1)}</span>
            </div>
          </div>

          <div className="mt-6 prose max-w-none">
            <h2 className="font-brand text-2xl" style={{fontFamily: "var(--font-baloo)"}}>About the University</h2>
            <p>
              This is a placeholder article for {uni.name}. Replace with your rich content.
              The page is built to support localization, structured data and future expansions (programs, fees, FAQs).
            </p>
            <p>
              Below you can find admission scores over the years, seats availability, student testimonials, media and related articles.
            </p>
          </div>
        </article>

        {/* Right rail with structured data */}
        <aside className="w-[360px] shrink-0">
          <div className="sticky top-[100px] flex flex-col gap-4">
            {/* Scores chart */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-semibold text-indigo-700">Minimum Admission Scores</div>
              <ScoreChart data={scores as any} />
            </div>

            {/* Seats */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm font-semibold text-indigo-700">Seats by Type (latest year)</div>
              {(() => {
                if (!seats?.length) return <div className="text-sm text-gray-500">No data</div>;
                const latest = seats.reduce((m:any, s:any)=> s.year>m ? s.year : m, 0);
                const latestSeats = seats.filter((s:any)=> s.year===latest);
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {latestSeats.map((s:any)=> (
                      <div key={`${s.candidateType}`} className="rounded-xl bg-indigo-50 p-3 text-indigo-800">
                        <div className="text-xs font-semibold uppercase">{s.candidateType}</div>
                        <div className="text-2xl font-bold">{s.seats}</div>
                        <div className="text-[11px] text-indigo-900/70">seats in {latest}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Testimonials */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm font-semibold text-indigo-700">Student Testimonials</div>
              <div className="flex flex-col gap-3">
                {(testimonials ?? []).slice(0,3).map((t:any)=> (
                  <div key={t.id} className="rounded-xl bg-gray-50 p-3">
                    <div className="text-sm font-semibold text-gray-800">{t.author}</div>
                    <div className="text-sm text-gray-700">{t.quote}</div>
                  </div>
                ))}
                {(!testimonials || testimonials.length===0) && (
                  <div className="text-sm text-gray-500">No testimonials yet.</div>
                )}
              </div>
            </div>

            {/* Media */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm font-semibold text-indigo-700">Latest Media</div>
              <div className="grid grid-cols-3 gap-2">
                {(media ?? []).slice(0,6).map((m:any)=> (
                  <a key={m.id} href={m.url} target="_blank" className="block overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.title ?? 'media'} className="h-20 w-full object-cover" />
                  </a>
                ))}
                {(!media || media.length===0) && <div className="text-sm text-gray-500">No media yet.</div>}
              </div>
            </div>

            {/* Articles */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm font-semibold text-indigo-700">Latest Articles</div>
              <div className="flex flex-col gap-2">
                {(articles ?? []).slice(0,5).map((a:any)=> (
                  <a key={a.id} href={a.href} className="text-sm text-indigo-700 underline">{a.title}</a>
                ))}
                {(!articles || articles.length===0) && <div className="text-sm text-gray-500">No related articles yet.</div>}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
