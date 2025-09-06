export default function Milestones() {
  const items = [
    {
      title: "Free Live Classes and Lessons",
      body:
        "Over the past four years, we’ve provided close to 700 students from low-income families with free private classes and coaching lessons to help them succeed in their admission exams.",
    },
    {
      title: "Past Admission Tests Solutions",
      body:
        "We’ve solved hundreds of past paper questions and made them available for free, empowering students to prepare without added costs.",
    },
    {
      title: "Free Coaching and Help in Applications",
      body:
        "We offer free personalized tips and coaching, and guidance in choosing the right medical school based on what matters most to you.",
    },
    {
      title: "Study Materials and Productivity Tools",
      body:
        "Our free study materials have been used by close to 50,000 people; our tools reached almost one million learners worldwide.",
    },
    {
      title: "The Biggest Premed Communities",
      body:
        "Join thousands of students across our WhatsApp hub and forums to get help and connect with peers and mentors.",
    },
  ];
  return (
    <section className="my-10">
      <h2 className="text-xl font-bold tracking-tight">Our Major Milestones</h2>
      <p className="mt-1 text-gray-600">What we’ve done so far</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((m) => (
          <div key={m.title} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-lg font-semibold">{m.title}</div>
            <p className="mt-1 text-gray-700">{m.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

