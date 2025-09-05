import { sanityClient } from '../../sanity/lib/client'

type Article = {
  _id: string
  title: string
  slug?: { current: string }
  language?: string
}

export default async function BlogPage() {
  const articles = await sanityClient.fetch<Article[]>(
    `*[_type == "article"] | order(publishedAt desc)[0...50]{ _id, title, slug, language }`
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Blog</h1>
      {articles.length === 0 ? (
        <p className="text-gray-500">No articles yet. Create one in the Studio.</p>
      ) : (
        <ul className="space-y-2">
          {articles.map((a) => (
            <li key={a._id}>
              <a href={`/blog/${a.slug?.current ?? a._id}`}>{a.title}</a>
              {a.language ? <span className="ml-2 text-xs text-gray-500">({a.language})</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

