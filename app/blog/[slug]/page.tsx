import { headers } from "next/headers";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const h = headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : "";
  const res = await fetch(`${origin}/api/posts/${params.slug}`, { cache: "no-store" });
  if (!res.ok) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="text-gray-600">The post you are looking for doesn’t exist.</p>
      </div>
    );
  }
  const post = await res.json();

  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h1>{post.title}</h1>
      <div className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleString()}</div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
    </article>
  );
}

