"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AdminUni = { id: number; name: string; logoUrl: string | null; rating: number | null };
type PageContent = { id: number; contentHtml: string } | null;
type Testimonial = { id?: number; author: string; quote: string; rating?: number | null; categories?: Record<string, number> };

export default function AdminUniversityPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [loading, setLoading] = useState(true);
  const [uni, setUni] = useState<AdminUni | null>(null);
  const [page, setPage] = useState<PageContent>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/admin/university/${slug}`);
      if (res.ok) {
        const json = await res.json();
        setUni(json.uni);
        setPage(json.page);
        setTestimonials(json.testimonials || []);
      }
      setLoading(false);
    })();
  }, [slug]);

  const [contentHtml, setContentHtml] = useState<string>("");
  useEffect(() => { setContentHtml(page?.contentHtml || ""); }, [page]);

  async function savePage() {
    await fetch(`/api/admin/university/${slug}/page`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentHtml }) });
    alert("Saved page content.");
  }

  function addTestimonial() {
    setTestimonials((t) => [...t, { author: "", quote: "", categories: { Overall: 4 }, rating: 4 }]);
  }

  async function saveTestimonial(t: Testimonial, idx: number) {
    const res = await fetch(`/api/admin/university/${slug}/testimonial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    });
    const json = await res.json();
    if (json?.id) {
      setTestimonials((arr) => arr.map((x, i) => (i === idx ? { ...t, id: json.id } : x)));
    }
    alert("Saved testimonial.");
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!uni) return <div className="p-6">University not found or access denied.</div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-bold text-indigo-700">Edit University: {uni.name}</h1>

      {/* Content editor */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-indigo-700">About Article (HTML)</div>
        <textarea
          className="h-64 w-full resize-vertical rounded-md border p-3 font-mono text-sm"
          value={contentHtml}
          onChange={(e) => setContentHtml(e.target.value)}
          placeholder="Paste HTML or write markup…"
        />
        <div className="mt-3 text-right">
          <button onClick={savePage} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Save Article</button>
        </div>
      </div>

      {/* Testimonials manager */}
      <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-indigo-700">Student Testimonials (with category ratings)</div>
          <button onClick={addTestimonial} className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">Add</button>
        </div>
        <div className="flex flex-col gap-4">
          {testimonials.map((t, idx) => (
            <div key={idx} className="rounded-xl border p-3">
              <div className="mb-2 flex gap-2">
                <input className="w-60 rounded border p-2 text-sm" placeholder="Author" value={t.author} onChange={(e)=>setTestimonials(v=>v.map((x,i)=>i===idx?{...x,author:e.target.value}:x))} />
                <input className="w-24 rounded border p-2 text-sm" placeholder="Overall" value={(t.rating ?? "").toString()} onChange={(e)=>setTestimonials(v=>v.map((x,i)=>i===idx?{...x,rating:Number(e.target.value)||0}:x))} />
              </div>
              <textarea className="w-full rounded border p-2 text-sm" rows={3} placeholder="Quote" value={t.quote} onChange={(e)=>setTestimonials(v=>v.map((x,i)=>i===idx?{...x,quote:e.target.value}:x))} />
              <div className="mt-2 text-xs font-semibold text-gray-600">Categories</div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {Object.entries(t.categories ?? {}).map(([k,val], jdx)=> (
                  <div key={jdx} className="flex items-center gap-2">
                    <input className="w-44 rounded border p-2 text-xs" value={k} onChange={(e)=>{
                      const nv = { ...(t.categories||{}) } as any; delete nv[k]; nv[e.target.value]=Number(val)||0; setTestimonials(v=>v.map((x,i)=>i===idx?{...x,categories:nv}:x));
                    }} />
                    <input className="w-20 rounded border p-2 text-xs" type="number" step="0.1" value={val as any} onChange={(e)=>{
                      const nv = { ...(t.categories||{}) } as any; nv[k]=Number(e.target.value)||0; setTestimonials(v=>v.map((x,i)=>i===idx?{...x,categories:nv}:x));
                    }} />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <button className="rounded bg-gray-100 px-2 py-1" onClick={()=>{
                  const nv = { ...(t.categories||{}) } as any; nv["Teaching Level"]=4; setTestimonials(v=>v.map((x,i)=>i===idx?{...x,categories:nv}:x));
                }}>+ Teaching Level</button>
                <button className="rounded bg-gray-100 px-2 py-1" onClick={()=>{
                  const nv = { ...(t.categories||{}) } as any; nv["Clinical Rounds"]=4; setTestimonials(v=>v.map((x,i)=>i===idx?{...x,categories:nv}:x));
                }}>+ Clinical Rounds</button>
                <button className="rounded bg-gray-100 px-2 py-1" onClick={()=>{
                  const nv = { ...(t.categories||{}) } as any; nv["The City"]=4; setTestimonials(v=>v.map((x,i)=>i===idx?{...x,categories:nv}:x));
                }}>+ The City</button>
              </div>
              <div className="mt-3 text-right">
                <button className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700" onClick={()=>saveTestimonial(t, idx)}>Save</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

