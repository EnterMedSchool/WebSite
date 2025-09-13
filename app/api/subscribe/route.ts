export async function POST(req: Request) {
  try {
    // Accept JSON or form-encoded bodies
    let email = "";
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({} as any));
      email = (body?.email || "").toString().trim();
    } else {
      const form = await req.formData();
      email = (form.get("email") || "").toString().trim();
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid email" }), { status: 400 });
    }
    // TODO: Wire to ESP provider (Mailchimp, Brevo, etc.)
    // For now, no-op success to avoid blocking UI.
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
}

