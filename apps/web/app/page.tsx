export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to EnterMedSchool</h1>
      <p>
        This is the starting point. Editors can use the embedded Studio to
        create content, and we’ll add authentication, subscriptions, quizzes,
        and gamification next.
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <a href="/studio">Open Sanity Studio</a> (requires project setup)
        </li>
        <li>
          <a href="/blog">View Blog</a> (lists articles from the CMS)
        </li>
      </ul>
    </div>
  )
}

