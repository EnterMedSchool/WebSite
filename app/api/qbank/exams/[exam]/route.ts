import { NextResponse } from "next/server";

import { QbankServiceError, getExamOverview } from "@/lib/qbank/service";
import type { qbankTopics } from "@/drizzle/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { exam: string } }) {
  const examSlug = params.exam?.trim();
  if (!examSlug) {
    return NextResponse.json({ error: "missing_exam_slug" }, { status: 400 });
  }

  try {
    const data = await getExamOverview(examSlug);

    const topicsBySectionId = new Map<number, ReturnType<typeof serializeTopic>[]>() ;
    for (const topic of data.topics) {
      const sectionId = topic.sectionId ? Number(topic.sectionId) : null;
      if (sectionId) {
        const list = topicsBySectionId.get(sectionId) ?? [];
        list.push(serializeTopic(topic));
        topicsBySectionId.set(sectionId, list);
      }
    }

    const sections = data.sections.map((section) => ({
      id: Number(section.id),
      slug: section.slug,
      name: section.name,
      description: section.description,
      orderIndex: Number(section.orderIndex ?? 0),
      metadata: (section.metadata as Record<string, unknown>) ?? {},
      topics: (topicsBySectionId.get(Number(section.id)) ?? []).sort((a, b) => a.orderIndex - b.orderIndex),
    }));

    const looseTopics = data.topics
      .filter((topic) => !topic.sectionId)
      .map(serializeTopic)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return NextResponse.json({
      exam: {
        id: Number(data.exam.id),
        slug: data.exam.slug,
        name: data.exam.name,
        description: data.exam.description,
        locale: data.exam.locale,
        defaultUnitSystem: data.exam.defaultUnitSystem,
        metadata: (data.exam.metadata as Record<string, unknown>) ?? {},
      },
      sections,
      looseTopics,
    });
  } catch (error) {
    if (error instanceof QbankServiceError) {
      if (error.code === "exam_not_found") {
        return NextResponse.json({ error: "exam_not_found" }, { status: 404 });
      }
    }
    console.error("[qbank exams overview]", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

type TopicRow = typeof qbankTopics.$inferSelect;

function serializeTopic(topic: TopicRow) {
  return {
    id: Number(topic.id),
    slug: topic.slug,
    title: topic.title,
    blueprintCode: topic.blueprintCode,
    depth: Number(topic.depth ?? 0),
    orderIndex: Number(topic.orderIndex ?? 0),
    metadata: (topic.metadata as Record<string, unknown>) ?? {},
  };
}
