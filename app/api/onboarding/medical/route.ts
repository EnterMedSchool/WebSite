import { NextRequest, NextResponse } from "next/server";

import { resolveUserIdFromSession } from "@/lib/user";
import { getUniversities, getSchoolsByUniversity, getCourses } from "@/lib/course-mates/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const userId = await resolveUserIdFromSession();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const universityIdRaw = searchParams.get("universityId");
  const schoolIdRaw = searchParams.get("schoolId");

  const universityId = parsePositive(universityIdRaw);
  const schoolId = parsePositive(schoolIdRaw);

  const payload: Record<string, unknown> = {};

  if (!universityId && !schoolId) {
    payload.universities = await getUniversities();
    return NextResponse.json(payload);
  }

  if (universityId && !schoolId) {
    payload.schools = await getSchoolsByUniversity(universityId);
    payload.courses = await getCourses({ uniId: universityId });
    return NextResponse.json(payload);
  }

  if (universityId && schoolId) {
    payload.courses = await getCourses({ uniId: universityId, schoolId });
    return NextResponse.json(payload);
  }

  if (!universityId && schoolId) {
    payload.courses = await getCourses({ schoolId });
    return NextResponse.json(payload);
  }

  payload.universities = await getUniversities();
  return NextResponse.json(payload);
}

function parsePositive(value: string | null): number | null {
  if (!value) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.trunc(num);
}
