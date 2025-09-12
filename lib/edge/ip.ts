export function getClientIpFromHeaders(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[0];
  }
  const real = headers.get('x-real-ip');
  if (real) return real;
  return null;
}

