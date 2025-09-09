import { authGetServerSession } from "@/lib/auth";
import { getCourseTimeline } from "@/lib/courseTimeline";
import CourseTimeline from "@/components/course/CourseTimeline";

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }: { params: { slug: string } }) {
  // Resolve userId for SSR progress (optional)
  let userId = 0;
  try {
    const session = await authGetServerSession();
    const uid = session && (session as any).userId ? Number((session as any).userId) : 0;
    if (Number.isSafeInteger(uid) && uid > 0 && uid <= 2147483647) userId = uid;
  } catch {}

  // Initial slice of the course timeline for fast first paint
  let data: Awaited<ReturnType<typeof getCourseTimeline>> | null = null;
  try {
    data = await getCourseTimeline({ courseSlug: params.slug, userId, limit: 4, cursor: null });
  } catch {}

  if (!data?.course) return <div className="mx-auto max-w-5xl p-6">Course not found.</div>;

  const { course, chapters, nextCursor } = data;

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-6 text-white shadow-[0_14px_42px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{course.title}</h1>
            {course.description ? <p className="mt-1 max-w-2xl text-sm text-white/90">{course.description}</p> : null}
          </div>
          <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Course</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6">
        <CourseTimeline slug={course.slug} courseTitle={course.title} initial={{ chapters, nextCursor }} />
      </div>
    </div>
  );
}
