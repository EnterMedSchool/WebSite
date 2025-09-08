import { authGetServerSession } from "@/lib/auth";
import Link from "next/link";
import RoomClient from "@/components/study/RoomClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getRoom(slug: string) {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/study/sessions/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()).data;
}

async function getMessages(sessionId: number) {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/study/messages?sessionId=${sessionId}`, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()).data;
}

async function getTasks(sessionId: number) {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/study/tasks?sessionId=${sessionId}`, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()).data;
}

export default async function RoomPage({ params }: { params: { slug: string } }) {
  const room = await getRoom(params.slug);
  if (!room) return (
    <section className="container mx-auto p-6">
      <p>Room not found.</p>
      <Link className="underline" href="/study-rooms">Back</Link>
    </section>
  );
  const [messages, taskLists] = await Promise.all([
    getMessages(room.id),
    getTasks(room.id)
  ]);

  // Pull userId into client via props
  const session = await authGetServerSession();
  const myUserId = (session as any)?.userId ? Number((session as any).userId) : null;

  return (
    <section className="container mx-auto p-6">
      <RoomClient room={room} messages={messages} taskLists={taskLists} myUserId={myUserId} />
    </section>
  );
}

