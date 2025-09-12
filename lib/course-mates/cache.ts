import { unstable_cache } from "next/cache";
import { sql } from "@/lib/db";

type Option = { id: number; name: string; slug?: string };

export const getUniversities = unstable_cache(async (): Promise<Option[]> => {
  try {
    const r = await sql`SELECT id, name FROM universities ORDER BY name ASC`;
    return r.rows as any;
  } catch {
    return [];
  }
}, ["universities:list:v1"], { revalidate: 60 * 60 * 24 });

export const getSchoolsByUniversity = unstable_cache(async (uniId: number): Promise<Option[]> => {
  if (!uniId) return [];
  try {
    const r = await sql`SELECT id, name, slug FROM schools WHERE university_id=${uniId} ORDER BY name ASC`;
    return r.rows as any;
  } catch {
    return [];
  }
}, (uniId: number) => ["schools:by-uni:v1", String(uniId)], { revalidate: 60 * 60 * 24 });

export const getCourses = unstable_cache(
  async (params: { uniId?: number | null; schoolId?: number | null }): Promise<Option[]> => {
    const uniId = params.uniId ?? null;
    const schoolId = params.schoolId ?? null;
    try {
      if (schoolId && uniId) {
        const r = await sql`SELECT id, name, slug FROM medical_school_courses WHERE school_id=${schoolId} AND university_id=${uniId} ORDER BY name ASC`;
        return r.rows as any;
      }
      if (schoolId) {
        const r = await sql`SELECT id, name, slug FROM medical_school_courses WHERE school_id=${schoolId} ORDER BY name ASC`;
        return r.rows as any;
      }
      if (uniId) {
        const r = await sql`SELECT id, name, slug FROM medical_school_courses WHERE university_id=${uniId} ORDER BY name ASC`;
        return r.rows as any;
      }
      return [];
    } catch {
      return [];
    }
  },
  (params: { uniId?: number | null; schoolId?: number | null }) => [
    "courses:v1",
    String(params.uniId ?? 0),
    String(params.schoolId ?? 0),
  ],
  { revalidate: 60 * 60 * 24 }
);

