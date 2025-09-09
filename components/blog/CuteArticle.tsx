import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Stats = { likes?: number; views?: number; comments?: number };

export default function CuteArticle({
  title,
  body,
  coverImage,
  category,
  date,
  author,
  authorAvatar,
  stats,
}: {
  title: string;
  body: string;
  coverImage?: string | null;
  category?: string;
  date?: string | Date | null;
  author?: string | null;
  authorAvatar?: string | null;
  stats?: Stats;
}) {
  const d = date ? new Date(date) : null;
  const formatted = d
    ? d.toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })
    : undefined;

  const likeCount = stats?.likes ?? 0;
  const viewCount = stats?.views ?? 0;
  const commentCount = stats?.comments ?? 0;

  const hero =
    coverImage ||
    "https://images.pexels.com/photos/255379/pexels-photo-255379.jpeg?cs=srgb&dl=pexels-padrinan-255379.jpg&fm=jpg";

  return (
    <section className="relative">
      {/* Full-bleed hero under the navbar padding */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-6 w-screen overflow-hidden rounded-b-[36px]">
        <div className="relative h-[260px] w-full sm:h-[360px] md:h-[420px]">
          <Image src={hero} alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/20 to-black/40" />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-6 top-10 h-24 w-24 rounded-full bg-sky-300/25 blur-2xl" />
            <div className="absolute right-10 bottom-12 h-28 w-28 rounded-full bg-indigo-300/25 blur-2xl" />
          </div>
        </div>
      </div>

      {/* Floating article card */}
      <div className="relative z-10 mx-auto -mt-10 w-full max-w-5xl lg:max-w-6xl px-4 sm:px-6">
        <div className="rounded-[28px] bg-gradient-to-b from-sky-200/60 via-indigo-200/40 to-transparent p-[1.5px]">
          <article className="rounded-[28px] bg-white shadow-xl ring-1 ring-slate-200">
            <header className="px-5 pb-2 pt-6 sm:px-8">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                {category ? (
                  <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">{category}</span>
                ) : null}
                {formatted ? <span className="text-slate-500">{formatted}</span> : null}
              </div>
              <h1 className="mt-3 font-[var(--font-baloo,_inherit)] text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
                {title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                {author ? (
                  <span className="inline-flex items-center gap-2">
                    {authorAvatar ? (
                      <Image src={authorAvatar} alt="" width={26} height={26} className="rounded-full" />
                    ) : null}
                    By {author}
                  </span>
                ) : null}
                <div className="ml-auto flex items-center gap-4">
                  <span className="inline-flex items-center gap-1"><span className="text-rose-500" aria-hidden>
                    ❤
                  </span> {likeCount}</span>
                  <span className="inline-flex items-center gap-1"><span className="text-slate-500" aria-hidden>
                    👁
                  </span> {Intl.NumberFormat().format(viewCount)}</span>
                  <span className="inline-flex items-center gap-1"><span className="text-emerald-500" aria-hidden>
                    💬
                  </span> {commentCount}</span>
                </div>
              </div>
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </header>

            <div className="prose prose-slate max-w-none px-5 pb-8 pt-4 sm:px-8 prose-a:text-sky-600 hover:prose-a:text-indigo-600 prose-headings:font-[var(--font-baloo,_inherit)] prose-img:rounded-xl">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

