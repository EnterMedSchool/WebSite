import NewPostForm from "@/components/admin/NewPostForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminSession } from "@/lib/authz";
import Link from "next/link";

export default async function NewPostPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-gray-600">You must be an admin to create posts.</p>
        <Link className="text-blue-600 underline" href="/api/auth/signin">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New Post</h1>
      <NewPostForm />
    </div>
  );
}

