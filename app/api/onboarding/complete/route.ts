import { NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { ONBOARDING_VERSION } from "@/lib/onboarding/constants";
import { resolveUserIdFromSession } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
type Persona = "premed" | "medical" | "resident" | "doctor";


export async function POST(request: NextRequest) {
  const userId = await resolveUserIdFromSession();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const persona = parsePersona(body?.userType);
  if (!persona) {
    return NextResponse.json({ error: "invalid_persona" }, { status: 400 });
  }

  const onboardingState: Record<string, unknown> = {
    completedVersion: ONBOARDING_VERSION,
    completedAt: new Date().toISOString(),
    userType: persona,
  };

  let profileStage: string = mapPersonaToStage(persona);
  let examTracks: Array<Record<string, unknown>> = [];

  if (persona === "premed") {
    const examId = typeof body?.premed?.examId === "string" && body.premed.examId.trim().length > 0 ? body.premed.examId.trim() : null;
    if (!examId) {
      return NextResponse.json({ error: "invalid_exam" }, { status: 400 });
    }
    const examLabel = labelForExam(examId);
    examTracks = [
      {
        id: examId,
        label: examLabel,
        isPrimary: true,
        status: "primary",
      },
    ];
    onboardingState.examId = examId;
  }

  if (persona === "medical") {
    const universityId = parsePositive(body?.medical?.universityId);
    const schoolId = parsePositive(body?.medical?.schoolId);
    const courseId = parsePositive(body?.medical?.courseId);
    const studyYear = parsePositive(body?.medical?.studyYear) ?? 1;

    if (!universityId || !schoolId || !courseId) {
      return NextResponse.json({ error: "invalid_school_selection" }, { status: 400 });
    }

    onboardingState.medical = { universityId, schoolId, courseId, studyYear };

    await sql`
      UPDATE users
      SET university_id = ${universityId},
          school_id = ${schoolId},
          medical_course_id = ${courseId},
          study_year = ${studyYear},
          school_status = CASE WHEN COALESCE(mates_verified, false) THEN school_status ELSE 'pending' END
      WHERE id = ${userId}
    `;
  }

  await sql`
    UPDATE users
    SET profile_stage = ${profileStage},
        exam_tracks = ${JSON.stringify(examTracks)}::jsonb,
        onboarding_state = ${JSON.stringify(onboardingState)}::jsonb
    WHERE id = ${userId}
  `;

  return NextResponse.json({ success: true, profileStage });
}

function parsePersona(value: unknown): Persona | null {
  if (value === "premed" || value === "medical" || value === "resident" || value === "doctor") {
    return value;
  }
  return null;
}

function mapPersonaToStage(persona: Persona): string {
  switch (persona) {
    case "premed":
      return "admissions";
    case "medical":
      return "medical";
    case "resident":
    case "doctor":
      return "resident";
    default:
      return "guest";
  }
}

function parsePositive(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.trunc(num);
}

function labelForExam(examId: string): string {
  switch (examId) {
    case "imat":
      return "IMAT";
    case "other":
      return "Other exam";
    default:
      return examId.toUpperCase();
  }
}
