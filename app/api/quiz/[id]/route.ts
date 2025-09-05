export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  return Response.json({
    id,
    question: "Which of the following is true about Next.js App Router?",
    choices: [
      "It only supports client components",
      "It enables nested layouts and server components",
      "It requires a separate Express server",
      "It cannot define API routes",
    ],
  });
}

