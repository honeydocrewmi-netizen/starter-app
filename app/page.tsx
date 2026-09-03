"use client";

import { useState, type FormEvent } from "react";
import { businessConfig } from "@/lib/business-config";
import { LIMITS, validateSubmission } from "@/lib/validation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-client";

type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;
type Status = "idle" | "submitting" | "done" | "not-stored" | "error";

export default function ContactPage() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    // Honeypot: a filled hidden field means a bot. Report success without writing anything.
    if (typeof data.company === "string" && data.company.trim() !== "") {
      setStatus("done");
      return;
    }

    const result = validateSubmission({
      name: data.name ?? "",
      email: data.email ?? "",
      message: data.message ?? "",
      source: data.source,
    });

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    // No Supabase project exists yet for this POC. Fail honestly rather than
    // faking a "thanks, we got it" that silently drops the message.
    if (!isSupabaseConfigured) {
      setStatus("not-stored");
      return;
    }

    setStatus("submitting");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("submissions").insert(result.value);
      if (error) {
        console.error("submit: insert failed", error.message);
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch (err) {
      // Covers an unreachable or paused Supabase project along with any other
      // network failure: never a silent success.
      console.error("submit: insert threw", err);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6 bg-[var(--bg)]">
        <div className="w-full max-w-lg text-center py-16 px-6">
          <h1 className="text-2xl font-semibold mb-2">Thanks — message received.</h1>
          <p className="text-[var(--muted)]">We&apos;ll be in touch shortly.</p>
        </div>
      </main>
    );
  }

  if (status === "not-stored") {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6 bg-[var(--bg)]">
        <div className="w-full max-w-lg text-center py-16 px-6">
          <h1 className="text-2xl font-semibold mb-2">Your message wasn&apos;t stored.</h1>
          <p className="text-[var(--muted)]">
            This is a preview of the site — the database isn&apos;t connected yet, so
            nothing was saved. Please reach us directly for now:{" "}
            {businessConfig.email || businessConfig.phone}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-[var(--bg)]">
      <div className="w-full max-w-lg">
        <noscript>
          <div
            className="rounded-2xl border p-4 mb-5 text-sm text-center"
            style={{ background: "var(--card)", borderColor: "var(--line)" }}
          >
            This form needs JavaScript to send your message. Please reach us directly:{" "}
            {businessConfig.email || businessConfig.phone}
          </div>
        </noscript>
        <header className="text-center mb-7">
          <div
            className="w-13 h-13 rounded-2xl grid place-items-center font-bold text-xl mx-auto mb-4"
            style={{ background: "var(--accent)", color: "var(--accent-ink)", width: 52, height: 52 }}
            aria-hidden="true"
          >
            {businessConfig.markInitial}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">{businessConfig.name}</h1>
          <p className="text-[var(--muted)] text-[0.98rem]">{businessConfig.tagline}</p>
        </header>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--line)" }}
        >
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-semibold mb-1.5">
              Name
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              required
              className="w-full px-3 py-2.5 rounded-lg border bg-transparent focus-ring"
              style={{ borderColor: "var(--line)" }}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm mt-1.5" style={{ color: "var(--err)" }}>
                {errors.name}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2.5 rounded-lg border bg-transparent focus-ring"
              style={{ borderColor: "var(--line)" }}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm mt-1.5" style={{ color: "var(--err)" }}>
                {errors.email}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-semibold mb-1.5">
              How can we help?
            </label>
            <textarea
              id="message"
              name="message"
              required
              maxLength={LIMITS.message.max}
              rows={5}
              className="w-full px-3 py-2.5 rounded-lg border bg-transparent focus-ring resize-y"
              style={{ borderColor: "var(--line)" }}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "message-error" : undefined}
            />
            {errors.message && (
              <p id="message-error" className="text-sm mt-1.5" style={{ color: "var(--err)" }}>
                {errors.message}
              </p>
            )}
          </div>

          {/* Honeypot: hidden from sighted and screen-reader users; bots fill every field. */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
            <label htmlFor="company">Company</label>
            <input id="company" name="company" tabIndex={-1} autoComplete="off" />
          </div>

          {status === "error" && (
            <p role="alert" className="text-sm mb-3" style={{ color: "var(--err)" }}>
              Couldn&apos;t send your message. Please try again in a moment.
            </p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full py-3 rounded-lg font-semibold disabled:opacity-60"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            {status === "submitting" ? "Sending…" : "Send message"}
          </button>
        </form>

        <footer className="text-center text-sm mt-5" style={{ color: "var(--muted)" }}>
          {businessConfig.phone && <span>{businessConfig.phone}</span>}
          {businessConfig.phone && businessConfig.email && <span> · </span>}
          {businessConfig.email && <span>{businessConfig.email}</span>}
        </footer>
      </div>
    </main>
  );
}
