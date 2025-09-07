import Link from "next/link";

export default function ResourcesMenu() {
  const items = [
    { href: "/blog", label: "Study Materials", sub: "Notes & guides" },
    { href: "/#parents", label: "For Parents", sub: "Help & information" },
    { href: "/#portal", label: "Student Portal", sub: "Tools & resources" },
    { href: "/#scholarships", label: "Scholarships", sub: "Financial aid" },
  ];
  return (
    <div className="group relative">
      <button className="text-xs font-semibold uppercase tracking-wide text-white/90 hover:text-white">
        Resources
        <span className="ml-1 inline-block rotate-0 transition-transform group-hover:rotate-180">▾</span>
      </button>
      <div className="pointer-events-none absolute right-0 top-full z-40 w-[520px] translate-y-2 opacity-0 transition-all group-hover:pointer-events-auto group-hover:translate-y-3 group-hover:opacity-100">
        <div className="rounded-2xl border border-white/20 bg-white/90 p-3 shadow-xl backdrop-blur">
          <div className="grid grid-cols-2 gap-2">
            {items.map((i) => (
              <Link key={i.label} href={i.href} className="rounded-xl p-3 hover:bg-indigo-50">
                <div className="text-sm font-semibold text-gray-900">{i.label}</div>
                <div className="text-xs text-gray-600">{i.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

