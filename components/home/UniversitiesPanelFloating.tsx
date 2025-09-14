"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MiniTrend from "@/components/home/MiniTrend";
import DeadlineStrip from "@/components/home/DeadlineStrip";
import CostTile from "@/components/home/CostTile";

type City = {
  id?: number;
  slug?: string;
  city: string;
  lat: number;
  lng: number;
  uni: string;
  kind?: "public" | "private";
  country?: string;
  language?: string;
  exam?: string;
  logo?: string;
  rating?: number;
  lastScore?: number;
  photos?: string[];
  orgs?: string[];
  article?: { title: string; href?: string };
  costRent?: number;
  costFoodIndex?: number;
  costTransport?: number;
  admOpens?: string;
  admDeadline?: string;
  admResults?: string;
  trendPoints?: Array<{ year: number; type: string; score: number }>;
  trendSeats?: Array<{ year: number; type: string; seats: number }>;
  emsCount?: number;
  // New optional enrichment fields (rendered when available)
  population?: number; // number of people in town
  campusDistanceKm?: number; // distance from city center
  address?: string; // real address of the campus
  tuitionMin?: number; // EUR, minimum tuition
  tuitionMax?: number; // EUR, maximum tuition
  scholarships?: string[]; // short bullet points
  tirociniHoursPerYear?: number; // internship hours per year
  facts?: string[]; // interesting facts
  reviewsCount?: number; // testimonials count if available
  scheduleExamples?: Array<{ day: string; items: Array<{ time: string; title: string }> }>; // optional sample schedule
  transportRoutes?: Array<{ from: string; line?: string; durationMin?: number; summary?: string }>; // common paths
};

export default function UniversitiesPanelFloating({ selectedName, items, onAddCompare, compareSet, onHover, savedSet, onToggleSave }: { selectedName: string; items: City[]; onAddCompare?: (item: City & { country?: string }) => void; compareSet?: Set<string>; onHover?: (item: City | null) => void; savedSet?: Set<string>; onToggleSave?: (item: City & { country?: string }) => void }) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<City | null>(null);
  const [openModal, setOpenModal] = useState<null | 'schedule' | 'transport' | 'tuition'>(null);
  const [isee, setIsee] = useState<string>("");

  const langs = useMemo(() => new Set((items || []).map((i: any) => (i as any).language || '').filter(Boolean)), [items]);
  const exams = useMemo(() => new Set((items || []).map((i: any) => (i as any).exam || '').filter(Boolean)), [items]);
  const emsTotal = useMemo(() => (items || []).reduce((s, i) => s + (Number((i as any).emsCount || 0)), 0), [items]);

  return (
    <div className="h-full">
      <div className="flex h-full flex-col rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-4 text-white shadow-[0_14px_40px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20 backdrop-blur">
        <div className="mb-3">
          <div className="ems-win-drag cursor-move text-sm font-extrabold uppercase tracking-wide text-white/90">{selectedName}</div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-lg bg-white/10 p-2 ring-1 ring-white/20"><div className="text-[11px] text-indigo-50">Universities</div><div className="text-base font-bold text-white">{items.length}</div></div>
            <div className="rounded-lg bg-white/10 p-2 ring-1 ring-white/20"><div className="text-[11px] text-indigo-50">Languages</div><div className="text-base font-bold text-white">{langs.size}</div></div>
            <div className="rounded-lg bg-white/10 p-2 ring-1 ring-white/20"><div className="text-[11px] text-indigo-50">Exams</div><div className="text-base font-bold text-white">{exams.size}</div></div>
            <div className="rounded-lg bg-white/10 p-2 ring-1 ring-white/20"><div className="text-[11px] text-indigo-50">EMS Students</div><div className="text-base font-extrabold text-white">{emsTotal}</div></div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="relative h-full max-h-full overflow-hidden rounded-2xl bg-white/95 p-3 text-gray-900 ring-1 ring-black/5" ref={listRef}>
            {/* Compact chips list */}
            <div className="flex h-full flex-wrap content-start gap-2 overflow-auto pr-1">
              {items.map((c, i) => (
                <button
                  key={`${c.city}-${i}`}
                  type="button"
                  onMouseEnter={() => onHover?.(c)}
                  onMouseLeave={() => onHover?.(null)}
                  onClick={() => setActive(c)}
                  className="group relative inline-flex max-w-full items-center gap-2 rounded-2xl bg-gradient-to-br from-white/95 to-indigo-50/30 px-3 py-2 text-[12px] font-semibold text-gray-800 ring-1 ring-indigo-200/50 shadow-sm hover:shadow-md hover:from-white hover:to-white transition-all hover:-translate-y-0.5"
                  title={`${c.uni} — ${c.city}`}
                >
                  <span className="relative grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-indigo-100 ring-2 ring-white shadow-[0_0_0_2px_rgba(99,102,241,0.25)]">
                    {c.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logo} alt="logo" className="h-full w-full object-cover" loading="lazy" decoding="async" fetchPriority="low" />
                    ) : (
                      <span className="text-[10px] font-extrabold text-indigo-700">{c.city[0]}</span>
                    )}
                  </span>
                  <span className="truncate max-w-[12rem] leading-5">{c.uni}</span>
                  <span className="hidden sm:inline text-[10px] font-normal text-gray-500">· {c.city}</span>
                  <span className="ml-2 flex items-center gap-1">
                    {c.exam && (
                      <span className="rounded-full bg-indigo-50 px-1.5 py-[2px] text-[9px] font-bold text-indigo-700 ring-1 ring-indigo-200">{String(c.exam).toUpperCase()}</span>
                    )}
                    {c.language && (
                      <span className="rounded-full bg-teal-50 px-1.5 py-[2px] text-[9px] font-semibold text-teal-700 ring-1 ring-teal-200">{String(c.language)}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>

            {/* Detail overlay when a university is chosen */}
            {active && (
              <div className="absolute inset-0 z-10 rounded-2xl bg-white p-3 ring-1 ring-black/10 shadow-2xl">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-indigo-100 flex items-center justify-center ring-2 ring-white shadow-[0_0_0_3px_rgba(99,102,241,0.25)]">
                    {active.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={active.logo} alt="logo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg font-semibold text-indigo-700">{active.city[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-extrabold text-gray-900 tracking-tight">{active.uni}</div>
                    <div className="text-sm text-gray-600">{active.city}{active.kind ? ` · ${active.kind}` : ''}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {active.exam && (<span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-200">{String(active.exam).toUpperCase()}</span>)}
                      {active.language && (<span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 ring-1 ring-teal-200">{String(active.language)}</span>)}
                      {typeof active.emsCount === 'number' && (<span className="rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold text-pink-700 ring-1 ring-pink-200">EMS {active.emsCount}</span>)}
                    </div>
                  </div>
                  <button type="button" onClick={() => setActive(null)} className="ml-auto rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800" aria-label="Close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                <div className="mt-3 rounded-2xl bg-gray-50 p-2 ring-1 ring-gray-200/60">
                  <MiniTrend uni={active.uni} id={active.id} root={listRef.current} prefetch={{ points: (active as any).trendPoints, seats: (active as any).trendSeats }} />
                </div>

                {/* Admissions + cost hints (existing) */}
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <DeadlineStrip opens={(active as any).admOpens} deadline={(active as any).admDeadline} results={(active as any).admResults} />
                  <CostTile city={active.city} rent={(active as any).costRent} foodIndex={(active as any).costFoodIndex} transport={(active as any).costTransport} />
                </div>

                {/* New: At-a-glance university details */}
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {/* City & campus */}
                  <div className="rounded-2xl border border-gray-200 p-3">
                    <div className="text-xs font-semibold text-gray-700">City & Campus</div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-700">
                      <div className="rounded-lg bg-gray-50 p-2">
                        <div className="text-[11px] text-gray-500">Population</div>
                        <div className="font-semibold">{typeof active.population === 'number' ? active.population.toLocaleString() : 'N/A'}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <div className="text-[11px] text-gray-500">From center</div>
                        <div className="font-semibold">{typeof active.campusDistanceKm === 'number' ? `${active.campusDistanceKm} km` : 'N/A'}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <div className="text-[11px] text-gray-500">Tirocini</div>
                        <div className="font-semibold">{typeof active.tirociniHoursPerYear === 'number' ? `${active.tirociniHoursPerYear} h/yr` : 'N/A'}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      <div className="truncate" title={active.address || ''}><span className="font-medium text-gray-700">Address:</span> {active.address || 'N/A'}</div>
                      {active.address && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(active.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-indigo-600 hover:underline"
                        >Open in Maps</a>
                      )}
                    </div>
                  </div>

                  {/* Tuition & scholarships */}
                  <div className="rounded-2xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-gray-700">Tuition</div>
                      <button type="button" onClick={() => setOpenModal('tuition')} className="rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">Estimate</button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-700">
                      <div className="rounded-lg bg-gray-50 p-2">
                        <div className="text-[11px] text-gray-500">Min/year</div>
                        <div className="font-semibold">{typeof active.tuitionMin === 'number' ? `€${active.tuitionMin.toLocaleString()}` : 'N/A'}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <div className="text-[11px] text-gray-500">Max/year</div>
                        <div className="font-semibold">{typeof active.tuitionMax === 'number' ? `€${active.tuitionMax.toLocaleString()}` : 'N/A'}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-semibold text-gray-700">Scholarship benefits</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(active.scholarships && active.scholarships.length > 0 ? active.scholarships : ['N/A']).slice(0,4).map((b, idx) => (
                          <span key={idx} className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 ring-1 ring-green-200">{b}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Schedules & transport */}
                  <div className="rounded-2xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-gray-700">Typical schedule</div>
                      <button type="button" onClick={() => setOpenModal('schedule')} className="rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">View examples</button>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      See sample weekly timetable and study rhythm.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-gray-700">Transportation</div>
                      <button type="button" onClick={() => setOpenModal('transport')} className="rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">Common routes</button>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">Most common bus paths from student areas to campus.</div>
                  </div>

                  {/* Reviews & facts */}
                  <div className="rounded-2xl border border-gray-200 p-3">
                    <div className="text-xs font-semibold text-gray-700">Reviews</div>
                    <div className="mt-1 text-xs text-gray-600">{typeof active.reviewsCount === 'number' ? `${active.reviewsCount} testimonials` : 'Coming soon'}</div>
                    <button type="button" onClick={() => { const slug = (active.uni || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); try { router.push(`/university/${encodeURIComponent(slug)}#reviews`); } catch {} }} className="mt-2 rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">Read reviews</button>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-3">
                    <div className="text-xs font-semibold text-gray-700">Interesting facts</div>
                    <ul className="mt-1 list-disc pl-4 text-xs text-gray-700 space-y-0.5">
                      {(active.facts && active.facts.length > 0 ? active.facts : ['White coat ceremony date TBD', 'Notable alumni info TBD']).slice(0,3).map((f, idx) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={() => onAddCompare?.({ ...active, country: selectedName })} className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${compareSet?.has(active.uni) ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700'}`}>{compareSet?.has(active.uni) ? 'Added to Compare' : 'Add to Compare'}</button>
                  <button type="button" onClick={() => onToggleSave?.({ ...active, country: selectedName })} className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${(typeof savedSet !== 'undefined' && savedSet?.has(active.uni)) ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-white text-pink-600 ring-1 ring-pink-200 hover:bg-pink-50'}`}>{savedSet?.has(active.uni) ? 'Saved' : 'Save'}</button>
                  <button type="button" onClick={() => { const slug = (active.uni || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); try { router.push(`/university/${encodeURIComponent(slug)}`); } catch {} }} className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">Open page</button>
                </div>

                {/* Simple modal overlay for schedule/transport/tuition */}
                {openModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOpenModal(null)} />
                    <div className="relative z-10 w-[min(92vw,720px)] max-h-[80vh] overflow-auto rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10">
                      <div className="flex items-start gap-2">
                        <div className="text-base font-semibold text-gray-900">
                          {openModal === 'schedule' && 'Typical Schedule Examples'}
                          {openModal === 'transport' && 'Common Transport Routes'}
                          {openModal === 'tuition' && 'Tuition Estimator (ISEE)'}
                        </div>
                        <button type="button" onClick={() => setOpenModal(null)} className="ml-auto rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800" aria-label="Close">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>

                      {openModal === 'schedule' && (
                        <div className="mt-3">
                          <div className="text-sm text-gray-600">Sample week to give a feel for the rhythm. Actual timetable varies by year.</div>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {((active.scheduleExamples && active.scheduleExamples.length>0) ? active.scheduleExamples : (
                              [
                                { day: 'Monday', items: [{ time: '08:30', title: 'Anatomy lecture' }, { time: '10:30', title: 'Clinical skills lab' }, { time: '14:00', title: 'Study / group work' }] },
                                { day: 'Tuesday', items: [{ time: '09:00', title: 'Biochemistry lecture' }, { time: '11:00', title: 'Seminar' }, { time: '15:00', title: 'Self study' }] },
                                { day: 'Wednesday', items: [{ time: '08:30', title: 'Physiology lecture' }, { time: '10:30', title: 'Lab' }, { time: '14:00', title: 'Clinical shadowing' }] },
                                { day: 'Thursday', items: [{ time: '09:00', title: 'Problem based learning' }, { time: '11:00', title: 'Workshop' }] },
                                { day: 'Friday', items: [{ time: '08:30', title: 'Histology lab' }, { time: '10:30', title: 'Review & Q&A' }] },
                              ]
                            )).map((d, idx) => (
                              <div key={idx} className="rounded-xl border border-gray-200 p-2">
                                <div className="mb-1 text-[11px] font-semibold text-gray-700">{d.day}</div>
                                <ul className="space-y-1">
                                  {d.items.map((it, j) => (
                                    <li key={j} className="flex items-center gap-2"><span className="w-12 text-gray-500">{it.time}</span><span className="text-gray-800">{it.title}</span></li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {openModal === 'transport' && (
                        <div className="mt-3">
                          <div className="text-sm text-gray-600">Popular public transport routes students take to reach campus.</div>
                          <div className="mt-3 space-y-2 text-xs">
                            {(active.transportRoutes && active.transportRoutes.length>0 ? active.transportRoutes : (
                              [{ from: 'City center', line: 'Bus 12', durationMin: 18, summary: 'Every 7 min · stop at Campus Gate' }, { from: 'Student area (north)', line: 'Tram T1', durationMin: 22, summary: 'Change to Bus 3 at Central' }]
                            )).map((r, idx) => (
                              <div key={idx} className="rounded-xl border border-gray-200 p-2">
                                <div className="flex items-center gap-2">
                                  <div className="text-[11px] font-semibold text-gray-700">From</div>
                                  <div className="text-gray-800">{r.from}</div>
                                  <div className="ml-auto text-gray-600">{typeof r.durationMin==='number' ? `${r.durationMin} min` : ''}</div>
                                </div>
                                <div className="mt-0.5 text-gray-700">{r.line ? `Line: ${r.line}` : ''}</div>
                                {r.summary && <div className="mt-0.5 text-gray-600">{r.summary}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {openModal === 'tuition' && (
                        <div className="mt-3">
                          <div className="text-sm text-gray-600">Enter your family ISEE to preview where you might fall. Exact calculation will be added later.</div>
                          <div className="mt-3 flex items-end gap-2">
                            <label className="text-xs text-gray-700">ISEE (€)
                              <input type="number" inputMode="numeric" value={isee} onChange={(e)=> setIsee(e.target.value)} placeholder="e.g. 16,000" className="mt-1 w-40 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </label>
                            <div className="text-xs text-gray-600">Range: {typeof active.tuitionMin==='number' ? `€${active.tuitionMin.toLocaleString()}` : 'N/A'} – {typeof active.tuitionMax==='number' ? `€${active.tuitionMax.toLocaleString()}` : 'N/A'} /year</div>
                          </div>
                          <div className="mt-3 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900 ring-1 ring-indigo-200">
                            Estimated tuition: <span className="font-semibold">{isee ? 'Coming soon' : 'Enter ISEE above'}</span>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
