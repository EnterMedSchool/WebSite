import type { Session } from "next-auth";

export function getAdminUsers(): string[] {
  const raw = process.env.ADMIN_USERS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminSession(session: Session | null): boolean {
  if (!session?.user?.name) return false;
  const admins = getAdminUsers();
  if (admins.length === 0) return false;
  return admins.includes(String(session.user.name).toLowerCase());
}

