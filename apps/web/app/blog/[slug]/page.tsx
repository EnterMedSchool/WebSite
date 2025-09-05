import { sanityClient } from '../../../sanity/lib/client'
import { PortableText } from '@portabletext/react'

type Article = {
  _id: string
  title: string
  slug?: { current: string }
  body?: any
  language?: string
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await sanityClient.fetch<Article | null>(
    `*[_type == "article" && slug.current == $slug][0]{ _id, title, slug, body, language }`,
    { slug: params.slug }
  )

  if (!article) {
    return <div>Not found</div>
  }

  return (
    <article className="prose">
      <h1>{article.title}</h1>
      {article.body ? <PortableText value={article.body} /> : <p>No content yet.</p>}
    </article>
  )
}

