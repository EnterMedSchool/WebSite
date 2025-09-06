export default function LearnAbout() {
  return (
    <section className="my-10">
      <h2 className="text-xl font-bold tracking-tight">Learn About EnterMedSchool!</h2>
      <p className="mt-1 text-gray-600">Using this platform to find the perfect medical school for you is a piece of cake! Just watch the following videos and find out more! Follow us on Instagram!</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-indigo-700">ems</div>
          <div className="mt-1 text-lg font-medium">Learn more about the idea behind EnterMedSchool</div>
          <div className="mt-3 aspect-video w-full rounded-lg bg-gray-100" />
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-indigo-700">ems</div>
          <div className="mt-1 text-lg font-medium">Our latest Instagram Post!</div>
          <div className="mt-3 aspect-video w-full rounded-lg bg-gray-100" />
        </div>
      </div>
    </section>
  );
}

