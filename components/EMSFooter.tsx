import Link from "next/link";
import Image from "next/image";
import LeoLogo from "@/assets/LeoLogoWebsite.png";

export default function EMSFooter() {
  const year = new Date().getFullYear();
  const studyEnabled = (process.env.NEXT_PUBLIC_STUDY_ROOMS_ENABLED === '1') || (process.env.NEXT_PUBLIC_STUDY_ROOMS_ENABLED === 'true') || (process.env.STUDY_ROOMS_ENABLED === '1') || (process.env.STUDY_ROOMS_ENABLED === 'true');

  const groups: Array<{ title: string; links: Array<{ label: string; href: string; external?: boolean }>; }>
    = [
    {
      title: "Learn",
      links: [
        { label: "IMAT Course", href: "/imat-course" },
        { label: "Course Mates", href: "/course-mates" },
        ...(studyEnabled ? [{ label: "Virtual Library", href: "/study-rooms" }] : []),
        { label: "Achievements", href: "/achievements" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blog", href: "/blog" },
        { label: "Scholarships", href: "/#scholarships" },
        { label: "Exams", href: "/#exams" },
        { label: "Universities", href: "/#universities" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Discord", href: "https://discord.gg/entermedschool", external: true },
        { label: "YouTube", href: "https://www.youtube.com/@entermedschool", external: true },
        { label: "X (Twitter)", href: "https://twitter.com/entermedschool", external: true },
        { label: "Instagram", href: "https://www.instagram.com/entermedschool/", external: true },
      ],
    },
  ];

  return (
    <footer className="relative mt-20">
      {/* Curvy seam to blend with page background (uses CSS var --bg) */}
      <div className="pointer-events-none absolute -top-10 inset-x-0 text-[rgb(var(--bg))]">
        <svg className="block h-10 w-full" viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden>
          <path d="M0,80 C 250,10 750,150 1000,80 L1000,0 L0,0 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Surface */}
      <div className="relative border-t border-slate-200/70 bg-white/80 text-slate-700 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200">
        {/* Aurora accent glow */}
        <div className="pointer-events-none absolute -top-16 left-1/2 h-24 w-[92%] -translate-x-1/2 rounded-[48px] blur-2xl"
             style={{
               background: "linear-gradient(90deg, rgba(37,99,235,.18), rgba(79,70,229,.18), rgba(124,58,237,.18))",
             }}
        />

        {/* Thin gradient rule echoing the navbar */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500/70 via-indigo-400/70 to-violet-500/70" />

        <div className="relative mx-auto max-w-screen-2xl px-4 py-10 sm:py-12">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr,1fr,1fr]">
            {/* Brand + CTA */}
            <div className="max-w-lg">
              <div className="flex items-center gap-3">
                <Image src={LeoLogo} alt="EnterMedSchool" width={36} height={36} className="rounded" />
                <span className="font-brand text-xl tracking-wide">EnterMedSchool</span>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300/90">
                Together we get you into med school.
              </p>

              <div className="mt-5">
                <Link href="/imat-course" className="btn-primary-shine h-10 px-4 text-[13px]">
                  Start Studying
                </Link>
              </div>
            </div>

            {/* Link groups */}
            {groups.map((g) => (
              <nav key={g.title} aria-label={g.title} className="text-sm">
                <div className="font-brand text-[15px] font-semibold tracking-wide text-slate-900 dark:text-white">
                  {g.title}
                </div>
                <ul className="mt-3 space-y-2">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      {l.external ? (
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-slate-600 transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 dark:text-slate-300/90 dark:hover:text-indigo-300"
                        >
                          {l.label}
                          <svg aria-hidden viewBox="0 0 20 20" className="ml-0.5 h-3.5 w-3.5 opacity-70"><path fill="currentColor" d="M12 3h5v5h-2V6.41l-7.29 7.3-1.42-1.42 7.3-7.29H12V3Z"/></svg>
                        </a>
                      ) : (
                        <Link
                          href={l.href}
                          className="inline-flex items-center rounded px-1 py-0.5 text-slate-600 transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 dark:text-slate-300/90 dark:hover:text-indigo-300"
                        >
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* Subfooter */}
          <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-slate-200/60 pt-6 text-[13px] dark:border-white/10 sm:flex-row sm:items-center">
            <div className="text-slate-500 dark:text-slate-400">
              © {year} EnterMedSchool — Built by students, for students
            </div>
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300/90">
              <a href="https://discord.gg/entermedschool" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="rounded p-1.5 transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 dark:hover:text-indigo-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path fill="currentColor" d="M20.317 4.369A19.791 19.791 0 0 0 16.558 3c-.2.356-.43.83-.592 1.205a18.27 18.27 0 0 0-7.932 0C7.372 3.83 7.142 3.356 6.942 3a19.8 19.8 0 0 0-3.76 1.369C.722 8.091-.449 11.686.153 15.216A19.9 19.9 0 0 0 6.54 18c.5-.689.946-1.42 1.332-2.188a12.9 12.9 0 0 1-2.09-.995c.176-.126.348-.257.515-.392a13.9 13.9 0 0 0 9.406 0c.167.135.339.266.515.392a12.9 12.9 0 0 1-2.09.995c.386.768.832 1.499 1.332 2.188a19.9 19.9 0 0 0 6.387-2.784c.736-4.222-.265-7.774-2.53-10.847ZM8.47 13.615c-.82 0-1.49-.78-1.49-1.737 0-.958.664-1.738 1.49-1.738.826 0 1.495.78 1.49 1.738 0 .957-.664 1.737-1.49 1.737Zm7.06 0c-.826 0-1.49-.78-1.49-1.737 0-.958.664-1.738 1.49-1.738.826 0 1.49.78 1.49 1.738 0 .957-.664 1.737-1.49 1.737Z"/></svg>
                <span className="sr-only">Discord</span>
              </a>
              <a href="https://www.youtube.com/@entermedschool" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="rounded p-1.5 transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 dark:hover:text-indigo-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path fill="currentColor" d="M23.499 6.203a3.005 3.005 0 0 0-2.116-2.127C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.383.576A3.005 3.005 0 0 0 .501 6.203 31.36 31.36 0 0 0 0 12a31.36 31.36 0 0 0 .501 5.797 3.005 3.005 0 0 0 2.116 2.127C4.5 20.5 12 20.5 12 20.5s7.5 0 9.383-.576a3.005 3.005 0 0 0 2.116-2.127A31.36 31.36 0 0 0 24 12a31.36 31.36 0 0 0-.501-5.797ZM9.75 15.5v-7l6 3.5-6 3.5Z"/></svg>
                <span className="sr-only">YouTube</span>
              </a>
              <a href="https://twitter.com/entermedschool" target="_blank" rel="noopener noreferrer" aria-label="X" className="rounded p-1.5 transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 dark:hover:text-indigo-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path fill="currentColor" d="M18.244 2H21l-6.27 7.17L22 22h-6.828l-4.77-6.217L4.8 22H2l6.74-7.71L2 2h6.91l4.37 5.833L18.244 2Zm-1.194 18h1.9L7.03 4h-1.96L17.05 20Z"/></svg>
                <span className="sr-only">X</span>
              </a>
              <a href="https://www.instagram.com/entermedschool/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded p-1.5 transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 dark:hover:text-indigo-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.35 3.608 1.325.975.975 1.263 2.242 1.325 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.35 2.633-1.325 3.608-.975.975-2.242 1.263-3.608 1.325-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.35-3.608-1.325-.975-.975-1.263-2.242-1.325-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.35-2.633 1.325-3.608C4.533 1.582 5.8 1.294 7.166 1.232 8.432 1.174 8.812 1.163 12 1.163Zm0 1.62c-3.163 0-3.532.012-4.777.069-1.028.047-1.586.218-1.957.363-.492.191-.843.419-1.213.789-.37.37-.598.721-.789 1.213-.145.371-.316.929-.363 1.957-.057 1.245-.069 1.614-.069 4.777s.012 3.532.069 4.777c.047 1.028.218 1.586.363 1.957.191.492.419.843.789 1.213.37.37.721.598 1.213.789.371.145.929.316 1.957.363 1.245.057 1.614.069 4.777.069s3.532-.012 4.777-.069c1.028-.047 1.586-.218 1.957-.363.492-.191.843-.419 1.213-.789.37-.37.598-.721.789-1.213.145-.371.316-.929.363-1.957.057-1.245.069-1.614.069-4.777s-.012-3.532-.069-4.777c-.047-1.028-.218-1.586-.363-1.957-.191-.492-.419-.843-.789-1.213-.37-.37-.721-.598-1.213-.789-.371-.145-.929-.316-1.957-.363-1.245-.057-1.614-.069-4.777-.069Zm0 3.857a4.36 4.36 0 1 1 0 8.722 4.36 4.36 0 0 1 0-8.722Zm0 1.62a2.74 2.74 0 1 0 0 5.481 2.74 2.74 0 0 0 0-5.481Zm5.58-2.963a1.02 1.02 0 1 1 0 2.04 1.02 1.02 0 0 1 0-2.04Z"/></svg>
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

