type Props = { params: { id: string } };

import { headers } from "next/headers";

export default async function QuizPage({ params }: Props) {
  const h = headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : "";

  const res = await fetch(`${origin}/api/quiz/${params.id}`, { cache: "no-store" });
  const data = await res.json();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Quiz #{data.id}</h1>
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <p className="font-medium">{data.question}</p>
        <ul className="mt-3 grid gap-2">
          {data.choices.map((c: string, i: number) => (
            <li key={i} className="rounded border p-2 hover:bg-gray-50">{c}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-gray-500">This is a static shell; real logic to be added.</p>
      </div>
    </div>
  );
}
