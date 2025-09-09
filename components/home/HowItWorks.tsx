export default function HowItWorks() {
  const steps = [
    {
      title: "Explore",
      bullets: [
        "Read about the admission process",
        "Find real reviews by real students",
        "Read about the city, and the student life",
      ],
      cta: { label: "All Medical Schools", href: "#universities" },
    },
    {
      title: "Study",
      bullets: [
        "Use our free study materials and books",
        "Find top exam takers who also tutor",
        "Ask questions using our communities",
      ],
    },
    {
      title: "Socialize",
      bullets: [
        "Study in our virtual libraries",
        "Meet more candidates in our WhatsApp",
        "Ask questions in the official forums",
      ],
      cta: { label: "Virtual Library", href: "/study-rooms" },
    },
  ];
  return (
    <section className="my-10">
      <h2 className="text-xl font-bold tracking-tight">How EnterMedSchool Works</h2>
      <p className="mt-1 text-gray-600">Three Simple Steps to Help You Find the Right Medical School and Prepare for the Admission Exam</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {steps.map((s, idx) => (
          <div key={s.title} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-3xl font-black text-indigo-600">{idx + 1}</div>
            <div className="mt-1 text-lg font-semibold">{s.title}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {s.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            {s.cta && (
              <a href={s.cta.href} className="mt-3 inline-block rounded-lg bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
                {s.cta.label}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
