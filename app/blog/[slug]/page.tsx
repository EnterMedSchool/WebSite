import { headers } from "next/headers";
import CuteArticle from "@/components/blog/CuteArticle";

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
    <CuteArticle
      title={post.title}
      body={post.body}
      coverImage={post.coverImageUrl}
      date={post.createdAt}
      category={post.category || 'Article'}
      author={post.author || 'EnterMedSchool'}
      stats={{ likes: post.likes || 0, views: post.views || 0, comments: post.comments || 0 }}
    />
  );
}
