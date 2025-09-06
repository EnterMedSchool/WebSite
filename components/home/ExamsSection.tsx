export default function ExamsSection() {
  const exams = [
    {
      id: "tolc-med",
      title: "TOLC-MED",
      body: "The TOLC-MED is the Italian equivalent of the IMAT. We are making materials for it!",
      bullets: ["Biology Books", "Practice Questions", "Communities", "Coaching"],
    },
    {
      id: "imat",
      title: "IMAT",
      body: "Free Class • Paid Class",
      bullets: ["IMAT Past Papers", "Unique Simulator", "Worked Solutions", "Free Online Course"],
      cta: { label: "Learn More", href: "#imat" },
    },
    {
      id: "neet",
      title: "NEET",
      body: "The NEET Exam is the admission exam of Medical Colleges in India. Study materials and guides coming soon!",
      bullets: ["NEET Books", "NEET Notes", "Communities", "Courses"],
    },
  ];
  return (
    <section id="exams" className="my-10">
      <h2 className="text-xl font-bold tracking-tight">Admission Exams — Study Materials</h2>
      <p className="mt-1 text-gray-600">Choose the relevant admission exam and start studying using EnterMedSchool!</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {exams.map((e) => (
          <div key={e.id} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-lg font-semibold">{e.title}</div>
            <p className="mt-1 text-gray-700">{e.body}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {e.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            {e.cta && (
              <a href={e.cta.href} className="mt-3 inline-block rounded-lg bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
                {e.cta.label}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

