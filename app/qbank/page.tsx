import { qbankTopics } from "@/drizzle/schema";
import { currentUserIdServer } from "@/lib/study/auth";
import { QbankServiceError, getExamOverview } from "@/lib/qbank/service";
import QbankPracticeClient from "@/components/qbank/QbankPracticeClient";
import type { InferSelectModel } from "drizzle-orm";

const DEFAULT_EXAM_SLUG = "imat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function QbankPage() {
  const userId = await currentUserIdServer();

  let overview: ReturnType<typeof serializeOverview> | null = null;
  try {
    const raw = await getExamOverview(DEFAULT_EXAM_SLUG);
    overview = serializeOverview(raw);
  } catch (error) {
    if (error instanceof QbankServiceError && error.code === "exam_not_found") {
      overview = null;
    } else {
      console.error("[qbank page]", error);
      overview = null;
    }
  }

  if (!overview) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-rose-900">
          <h1 className="text-2xl font-semibold">Question bank coming soon</h1>
          <p className="mt-2 text-sm">
            We are still calibrating the practice engine for this exam. Check back shortly as we roll out the new experience.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <QbankPracticeClient
        exam={{ slug: overview.exam.slug, name: overview.exam.name, description: overview.exam.description ?? undefined }}
        sections={overview.sections}
        looseTopics={overview.looseTopics}
        isLoggedIn={Boolean(userId)}
      />
    </main>
  );
}

type TopicRow = InferSelectModel<typeof qbankTopics>;

function serializeOverview(data: Awaited<ReturnType<typeof getExamOverview>>) {
  const sections = data.sections.map((section) => ({
    id: Number(section.id),
    slug: section.slug,
    name: section.name,
    description: section.description,
    orderIndex: Number(section.orderIndex ?? 0),
    metadata: (section.metadata as Record<string, unknown>) ?? {},
    topics: data.topics
      .filter((topic) => Number(topic.sectionId ?? 0) === Number(section.id))
      .map(serializeTopic)
      .sort((a, b) => a.orderIndex - b.orderIndex),
  }));

  const looseTopics = data.topics
    .filter((topic) => !topic.sectionId)
    .map(serializeTopic)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    exam: {
      id: Number(data.exam.id),
      slug: data.exam.slug,
      name: data.exam.name,
      description: data.exam.description,
    },
    sections,
    looseTopics,
  };
}

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
