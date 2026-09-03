import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { validateSubmission } from "@/lib/validation";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;

  // Honeypot: a filled hidden field means a bot. Report success without writing anything.
  if (typeof input.company === "string" && input.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const result = validateSubmission({
    name: String(input.name ?? ""),
    email: String(input.email ?? ""),
    message: String(input.message ?? ""),
    source: input.source ? String(input.source) : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Invalid submission.", fields: result.errors }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (err) {
    console.error("submit: supabase not configured", err);
    return NextResponse.json(
      { error: "Couldn't send your message right now. Please try again shortly." },
      { status: 503 },
    );
  }

  try {
    const { error } = await supabase.from("submissions").insert(result.value);
    if (error) {
      console.error("submit: insert failed", error.message);
      return NextResponse.json(
        { error: "Couldn't send your message right now. Please try again shortly." },
        { status: 502 },
      );
    }
  } catch (err) {
    // Covers the paused-project case (Supabase returns HTTP 540, a non-standard
    // status that can make the client throw instead of returning a clean
    // error object) along with any other network failure: never a silent success.
    console.error("submit: insert threw", err);
    return NextResponse.json(
      { error: "Couldn't send your message right now. Please try again shortly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
