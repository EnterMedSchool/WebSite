import type { Session } from "next-auth";

import { sql } from "@/lib/db";
import { ONBOARDING_VERSION } from "@/lib/onboarding/constants";

export type DashboardProfileStage = "guest" | "admissions" | "medical" | "resident" | "multi";
export type DashboardView = "showcase" | "admissions-dashboard" | "medical-dashboard" | "resident-dashboard";

export type DashboardExamTrack = {
  id: string;
  label: string;
  country?: string | null;
  status?: string | null;
  isPrimary?: boolean;
};

export type DashboardOnboarding = {
  completedVersion: number;
  completedAt: string | null;
  userType: string | null;
  shouldShow: boolean;
};

export type DashboardContext = {
  view: DashboardView;
  stage: DashboardProfileStage;
  displayName: string | null;
  examTracks: DashboardExamTrack[];
  primaryCountry: string | null;
  onboarding: DashboardOnboarding;
  needsOnboarding: boolean;
  needsSchoolRequest: boolean;
  schoolStatus: string | null;
  schoolId: number | null;
  schoolPreferences: Record<string, unknown> | null;
  dashboardPreferences: Record<string, unknown> | null;
};

type RawDashboardRow = {
  id: number;
  username: string | null;
  name: string | null;
  email: string | null;
  profile_stage: string | null;
  exam_tracks: unknown;
  admissions_focus_country: string | null;
  school_status: string | null;
  school_id: number | null;
  mates_verified: boolean | null;
  school_preferences: unknown;
  dashboard_preferences: unknown;
  onboarding_state: unknown;
};

const DEFAULT_CONTEXT: DashboardContext = {
  view: "showcase",
  stage: "guest",
  displayName: null,
  examTracks: [],
  primaryCountry: null,
  onboarding: { completedVersion: 0, completedAt: null, userType: null, shouldShow: false },
  needsOnboarding: false,
  needsSchoolRequest: false,
  schoolStatus: null,
  schoolId: null,
  schoolPreferences: null,
  dashboardPreferences: null,
};

const PROFILE_STAGE_MAP: Record<string, DashboardProfileStage> = {
  guest: "guest",
  admissions: "admissions",
  medical: "medical",
  resident: "resident",
  multi: "multi",
};

function coerceExamTracks(value: unknown): DashboardExamTrack[] {
  if (!value) return [];
  const raw = typeof value === "string" ? tryParse(value, []) : value;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const obj = entry as Record<string, unknown>;
      const id = typeof obj.id === "string" && obj.id.trim().length > 0 ? obj.id.trim() : null;
      const label = typeof obj.label === "string" && obj.label.trim().length > 0 ? obj.label.trim() : id;
      if (!id || !label) return null;
      return {
        id,
        label,
        country: typeof obj.country === "string" ? obj.country : null,
        status: typeof obj.status === "string" ? obj.status : null,
        isPrimary: Boolean(obj.isPrimary || obj.primary || obj.focus),
      } satisfies DashboardExamTrack;
    })
    .filter(Boolean) as DashboardExamTrack[];
}

function tryParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return fallback;
  }
}

function coerceRecord(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  const raw = typeof value === "string" ? tryParse<Record<string, unknown>>(value, {}) : value;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

function deriveDisplayName(row: RawDashboardRow): string | null {
  const nameCandidate = (row.name ?? row.username ?? row.email ?? "").trim();
  if (!nameCandidate) return null;
  return nameCandidate;
}

function deriveStage(row: RawDashboardRow, examTracks: DashboardExamTrack[]): DashboardProfileStage {
  const rawStage = (row.profile_stage ?? "guest").toLowerCase();
  const mappedStage = PROFILE_STAGE_MAP[rawStage] ?? "guest";
  if (mappedStage !== "guest") return mappedStage;
  // No explicit stage: infer from related data
  if (row.mates_verified) return "medical";
  if (row.school_status && row.school_status.toLowerCase() === "verified") return "medical";
  if (row.school_id && row.school_id > 0) return "medical";
  if (examTracks.length > 1) return "multi";
  if (examTracks.length === 1) return "admissions";
  return "admissions";
}

function deriveView(stage: DashboardProfileStage): DashboardView {
  switch (stage) {
    case "medical":
      return "medical-dashboard";
    case "resident":
      return "resident-dashboard";
    case "multi":
    case "admissions":
      return "admissions-dashboard";
    case "guest":
    default:
      return "showcase";
  }
}

function computeNeedsSchoolRequest(stage: DashboardProfileStage, row: RawDashboardRow): boolean {
  if (stage === "admissions" || stage === "guest") return false;
  const status = (row.school_status ?? "").toLowerCase();
  if (row.school_id && row.school_id > 0) return false;
  if (status === "verified") return false;
  return true;
}

export async function loadDashboardContext(session: Session | null): Promise<DashboardContext> {
  if (!session) return DEFAULT_CONTEXT;
  const row = await fetchRowForSession(session);
  if (!row) return DEFAULT_CONTEXT;

  const rawExamTracks = coerceExamTracks(row.exam_tracks);
  const stage = deriveStage(row, rawExamTracks);
  const view = deriveView(stage);
  const examTracks = stage === "admissions" || stage === "multi" ? rawExamTracks : [];
  const displayName = deriveDisplayName(row);
  const schoolPreferences = coerceRecord(row.school_preferences);
  const dashboardPreferences = coerceRecord(row.dashboard_preferences);
  const primaryCountry = row.admissions_focus_country ?? null;

  const onboardingRecord = coerceRecord(row.onboarding_state);
  const completedVersion = Math.max(0, Number((onboardingRecord as any)?.completedVersion ?? 0));
  const completedAtValue = (onboardingRecord as any)?.completedAt;
  const userTypeValue = (onboardingRecord as any)?.userType;
  const onboarding: DashboardOnboarding = {
    completedVersion,
    completedAt: typeof completedAtValue === "string" ? completedAtValue : null,
    userType: typeof userTypeValue === "string" ? userTypeValue : null,
    shouldShow: completedVersion < ONBOARDING_VERSION,
  };

  if (!onboarding.shouldShow) {
    if (stage === "guest") onboarding.shouldShow = true;
    else if ((stage === "admissions" || stage === "multi") && examTracks.length === 0) onboarding.shouldShow = true;
  }

  const needsOnboarding = onboarding.shouldShow;
  const needsSchoolRequest = computeNeedsSchoolRequest(stage, row);

  return {
    view,
    stage,
    displayName,
    examTracks,
    primaryCountry,
    onboarding,
    needsOnboarding,
    needsSchoolRequest,
    schoolStatus: row.school_status,
    schoolId: row.school_id,
    schoolPreferences,
    dashboardPreferences,
  };
}

async function fetchRowForSession(session: Session | null): Promise<RawDashboardRow | null> {
  if (!session) return null;
  const rawId = Number((session as unknown as { userId?: unknown })?.userId ?? 0);
  if (Number.isSafeInteger(rawId) && rawId > 0 && rawId <= 2147483647) {
    const byId = await sql<RawDashboardRow>`
      SELECT id, username, name, email, profile_stage, exam_tracks,
             admissions_focus_country, school_status, school_id, mates_verified,
             school_preferences, dashboard_preferences, onboarding_state
      FROM users
      WHERE id = ${rawId}
      LIMIT 1
    `;
    if (byId.rows[0]) return byId.rows[0];
  }

  const email = String((session as unknown as { user?: { email?: string } }).user?.email ?? "").toLowerCase().trim();
  if (!email) return null;
  const byEmail = await sql<RawDashboardRow>`
    SELECT id, username, name, email, profile_stage, exam_tracks,
           admissions_focus_country, school_status, school_id, mates_verified,
           school_preferences, dashboard_preferences, onboarding_state
    FROM users
    WHERE lower(email) = ${email}
    LIMIT 1
  `;
  return byEmail.rows[0] ?? null;
}



