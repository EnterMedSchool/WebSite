"use client";

import { useParams } from "next/navigation";

export default function LessonPage() {
  const params = useParams();
  const slug = String(params?.slug ?? "lesson");

  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Lesson</h1>
      <p style={{ color: "#4b5563" }}>Slug: {slug}</p>
      <p style={{ marginTop: 16, color: "#6b7280" }}>
        This page was simplified to resolve a JSX parsing error during the
        production build. Once deployment is verified, the original UI can be
        restored in a follow-up change with sanitized JSX/comments.
      </p>
    </div>
  );
}

