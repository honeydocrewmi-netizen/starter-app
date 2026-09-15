"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import {
  businessConfig,
  hasEmail,
  hasPhone,
  isEmailUnset,
  isPhoneUnset,
} from "@/lib/business-config";
import {
  LIMITS,
  SERVICE_OPTIONS,
  STORY_OPTIONS,
  TREE_OPTIONS,
  URGENCY_OPTIONS,
  validateSubmission,
  type Service,
} from "@/lib/validation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-client";

type FieldErrors = Partial<Record<"name" | "phone" | "email" | "address" | "services", string>>;
type Status = "idle" | "submitting" | "done" | "not-stored" | "error";

const STORY_LABELS: Record<(typeof STORY_OPTIONS)[number], string> = {
  "1": "1 story",
  "2": "2 stories",
  "3+": "3 or more",
};

const TREE_LABELS: Record<(typeof TREE_OPTIONS)[number], string> = {
  none: "No trees",
  "a-few": "A few trees",
  "a-lot": "A lot of trees",
};

const URGENCY_LABELS: Record<(typeof URGENCY_OPTIONS)[number], string> = {
  asap: "As soon as possible",
  "this-month": "Sometime this month",
  "just-pricing": "Just checking prices",
};

function FallLeaf({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 90" fill="none" aria-hidden="true">
      <path d="m40 3 10 19 10-7-2 21 17-3-8 16 9 5-24 15-10-1-2 15-4-1 1-15-10 2L4 54l9-5-8-16 18 3-3-21 11 7Z" fill="currentColor" />
      <path d="M40 24v43M25 40l15 15 15-15M19 54l21 8 21-8" stroke="var(--hero-bg)" strokeOpacity=".28" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ServiceIcon({ service }: { service: Service }) {
  if (service === "gutters") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 6v4a2 2 0 0 0 2 2h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M9 12v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6.5 17.5 9 20l2.5-2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (service === "roof") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 12 12 4l9 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 10.5V19h13v-8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21c-4-1-7-5-7-9.5S9 4 12 3c3 1 7 3 7 8.5S16 20 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 21V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function QuoteRequestPage() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  // Deliberately NOT `!hasPhone() / !hasEmail()`. A field the owner has
  // answered with "we don't have one" (null) is finished, and nagging a
  // customer about it on a live page is worse than the missing value —
  // this banner is addressed to whoever is setting the site up, so it must
  // only appear while something is genuinely still unanswered. HoneyDo Crew
  // has no email on purpose, and a page with a working phone number and a
  // quote form is complete without one.
  const missingSetup = [
    isPhoneUnset() && "a phone number",
    isEmailUnset() && "an email address",
  ].filter((v): v is string => Boolean(v));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData) as Record<string, string>;

    // Honeypot: a filled hidden field means a bot. Report success without writing anything.
    if (typeof data.company === "string" && data.company.trim() !== "") {
      setStatus("done");
      return;
    }

    const result = validateSubmission({
      name: data.name ?? "",
      phone: data.phone ?? "",
      email: data.email,
      address: data.address ?? "",
      services: formData.getAll("services").map(String),
      stories: data.stories,
      trees: data.trees,
      urgency: data.urgency,
      notes: data.notes,
      source: data.source,
    });

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    // No Supabase project exists yet for this POC. Fail honestly rather than
    // faking a "thanks, we got it" that silently drops the request.
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
        <div className="w-full max-w-md text-center py-16 px-6">
          <h1 className="font-display text-3xl font-semibold mb-2">Got it — thanks.</h1>
          <p className="text-[var(--muted)]">
            {businessConfig.name} will call{hasPhone() ? " the number you gave us" : " you back"}{" "}
            to line up a time.
          </p>
        </div>
      </main>
    );
  }

  if (status === "not-stored") {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6 bg-[var(--bg)]">
        <div className="w-full max-w-md text-center py-16 px-6">
          <h1 className="font-display text-3xl font-semibold mb-2">Your request wasn&apos;t saved.</h1>
          <p className="text-[var(--muted)]">
            This is a preview of the site — the database isn&apos;t connected yet, so nothing was
            saved. Please reach us directly for now
            {(hasPhone() || hasEmail()) && ":"}
            {hasPhone() && <> {businessConfig.phone}</>}
            {hasPhone() && hasEmail() && " · "}
            {hasEmail() && <> {businessConfig.email}</>}
            {!hasPhone() && !hasEmail() && "."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="site-shell">
      <div className="topbar">
        <a className="wordmark" href="#top" aria-label="HoneyDo Crew home">
          <Image className="wordmark-logo" src="/honeydo-bee-logo.png" alt="" width={1402} height={1122} />
          <span><strong>HoneyDo</strong><small>Crew</small></span>
        </a>
        <div className="topbar-links">
          <a href="#services">Services</a>
          <a href="#areas">Service area</a>
          <a className="call-pill" href={`tel:${businessConfig.phone}`}>Call {businessConfig.phone}</a>
        </div>
      </div>
      <div className="page-wrap" id="top">
        <noscript>
          <div
            className="rounded-2xl border p-4 mb-5 text-sm text-center"
            style={{ background: "var(--card)", borderColor: "var(--line)" }}
          >
            This form needs JavaScript to send your request.
            {hasPhone() && <> Please call {businessConfig.phone}.</>}
          </div>
        </noscript>

        <header className="hero-panel">
          <div className="fall-scatter" aria-hidden="true">
            <FallLeaf className="fall-leaf leaf-one" />
            <FallLeaf className="fall-leaf leaf-two" />
            <FallLeaf className="fall-leaf leaf-three" />
            <FallLeaf className="fall-leaf leaf-four" />
          </div>
          <div className="hero-copy">
            <p className="eyebrow fall-badge"><FallLeaf /> Fall leaf cleanup</p>
            <h1>Love the fall.<br /><em>Leave the leaves.</em></h1>
            <p className="hero-description">
              Leaves in the gutters, on the roof, or all over the yard? HoneyDo Crew
              helps clear them out so you can get back to enjoying your fall weekend.
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="#quote">Get a free quote <span>→</span></a>
              <a className="text-link" href={`sms:${businessConfig.phone.replace(/\D/g, "")}`}>Text us</a>
            </div>
          </div>
          <div className="hero-visual">
            <Image className="hero-logo" src="/honeydo-bee-logo.png" alt="HoneyDo Crew bee carrying tools. Ready to tackle your honey-do list." width={1402} height={1122} preload />
          </div>
          <ul className="hero-services">
            {SERVICE_OPTIONS.map((s) => (
              <li key={s}>
                <ServiceIcon service={s} />
                {s === "gutters" ? "Gutter cleanup" : s === "roof" ? "Roof cleanup" : "Yard cleanup"}
              </li>
            ))}
          </ul>
        </header>

        <div className="fall-ribbon">
          <FallLeaf />
          <p>Less raking. <strong>More fall weekends.</strong></p>
          <FallLeaf />
        </div>

        <section className="services-showcase" id="services">
          <div className="section-intro">
            <p className="eyebrow">Your fall cleanup crew</p>
            <h2>Three places.<br />One less chore.</h2>
            <p>We’re focused on leaves this fall. Pick the areas that need attention and we’ll talk through the cleanup and your quote.</p>
          </div>
          <div className="service-cards">
            <article><ServiceIcon service="gutters" /><small>01</small><h3>Gutter cleanup</h3><p>Clear out fallen leaves and seasonal buildup so water can flow through your gutters.</p><a href="#quote">Get a gutter cleanup quote →</a></article>
            <article><ServiceIcon service="roof" /><small>02</small><h3>Roof cleanup</h3><p>Have leaves collecting on your roof? Tell us about your home and we’ll discuss the cleanup.</p><a href="#quote">Get a roof cleanup quote →</a></article>
            <article><ServiceIcon service="yard" /><small>03</small><h3>Yard cleanup</h3><p>Take the leaf-covered lawn off your weekend list. We’ll help get those fallen leaves gathered and cleared.</p><a href="#quote">Get a yard cleanup quote →</a></article>
          </div>
        </section>

        <section className="area-band" id="areas">
          <div><p className="eyebrow">Proudly serving your neighborhood</p><h2>Close by and ready to help.</h2></div>
          <div className="city-grid">
            {['Livonia', 'Farmington', 'Westland', 'Northville', 'Plymouth', 'Novi'].map((city) => <span key={city}>{city}</span>)}
          </div>
        </section>

        {missingSetup.length > 0 && (
          <div
            className="rounded-2xl border-2 border-dashed p-4 mb-5 text-sm"
            style={{ borderColor: "var(--accent)", color: "var(--ink)" }}
          >
            <strong>Setup needed:</strong> add {missingSetup.join(" and ")} in{" "}
            <code>lib/business-config.ts</code> before printing this page anywhere.
          </div>
        )}

        <div className="quote-layout" id="quote">
          <div className="quote-copy">
            <p className="eyebrow">Free fall cleanup quote</p>
            <h2>Leave the leaf pile to us.</h2>
            <p>Share where the leaves are collecting and we’ll call or text to talk through your fall cleanup. It takes about a minute.</p>
            <div className="direct-call"><span>Prefer to talk now?</span><a href={`tel:${businessConfig.phone}`}>{businessConfig.phone}</a><small>Call or text</small></div>
          </div>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="quote-form"
        >
          <h2>Tell us about your leaf cleanup</h2>
          <p className="form-lede">We’ll use this to prepare for the conversation.</p>

          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-semibold mb-1.5">
              Your name
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
            <label htmlFor="phone" className="block text-sm font-semibold mb-1.5">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="(734) 555-0123"
              className="w-full px-3 py-2.5 rounded-lg border bg-transparent focus-ring"
              style={{ borderColor: "var(--line)" }}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
            {errors.phone && (
              <p id="phone-error" className="text-sm mt-1.5" style={{ color: "var(--err)" }}>
                {errors.phone}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold mb-1.5">
              Email <span className="font-normal" style={{ color: "var(--muted)" }}>(optional)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
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
            <label htmlFor="address" className="block text-sm font-semibold mb-1.5">
              Service address and city
            </label>
            <input
              id="address"
              name="address"
              autoComplete="street-address"
              required
              placeholder="Where the work is"
              className="w-full px-3 py-2.5 rounded-lg border bg-transparent focus-ring"
              style={{ borderColor: "var(--line)" }}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? "address-error" : undefined}
            />
            {errors.address && (
              <p id="address-error" className="text-sm mt-1.5" style={{ color: "var(--err)" }}>
                {errors.address}
              </p>
            )}
          </div>

          <fieldset className="mb-4">
            <legend className="block text-sm font-semibold mb-1.5">
              What can we help with?
            </legend>
            {/* Stacked on phones: three across leaves ~2px for the label once
                the checkbox and icon take their space. Three across from sm up. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SERVICE_OPTIONS.map((s) => (
                <label key={s} className="chip">
                  <input type="checkbox" name="services" value={s} />
                  <ServiceIcon service={s} />
                  <span className="text-sm font-medium">{s === "gutters" ? "Gutter cleanup" : s === "roof" ? "Roof cleanup" : "Yard cleanup"}</span>
                </label>
              ))}
            </div>
            {errors.services && (
              <p className="text-sm mt-1.5" role="alert" style={{ color: "var(--err)" }}>
                {errors.services}
              </p>
            )}
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label htmlFor="stories" className="block text-sm font-semibold mb-1.5">
                Stories
              </label>
              <select
                id="stories"
                name="stories"
                defaultValue=""
                className="w-full px-3 py-2.5 rounded-lg border bg-transparent focus-ring"
                style={{ borderColor: "var(--line)" }}
              >
                <option value="">Not sure</option>
                {STORY_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {STORY_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="trees" className="block text-sm font-semibold mb-1.5">
                Trees
              </label>
              <select
                id="trees"
                name="trees"
                defaultValue=""
                className="w-full px-3 py-2.5 rounded-lg border bg-transparent focus-ring"
                style={{ borderColor: "var(--line)" }}
              >
                <option value="">Not sure</option>
                {TREE_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {TREE_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="urgency" className="block text-sm font-semibold mb-1.5">
              When do you need this done?
            </label>
            <select
              id="urgency"
              name="urgency"
              defaultValue=""
              className="w-full px-3 py-2.5 rounded-lg border bg-transparent focus-ring"
              style={{ borderColor: "var(--line)" }}
            >
              <option value="">No preference</option>
              {URGENCY_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {URGENCY_LABELS[v]}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-semibold mb-1.5">
              Anything else? <span className="font-normal" style={{ color: "var(--muted)" }}>(optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              maxLength={LIMITS.notes.max}
              rows={3}
              placeholder="Gate code, second building, anything we should know"
              className="w-full px-3 py-2.5 rounded-lg border bg-transparent focus-ring resize-y"
              style={{ borderColor: "var(--line)" }}
            />
          </div>

          {/* Honeypot: hidden from sighted and screen-reader users; bots fill every field. */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
            <label htmlFor="company">Company</label>
            <input id="company" name="company" tabIndex={-1} autoComplete="off" />
          </div>

          {status === "error" && (
            <p role="alert" className="text-sm mb-3" style={{ color: "var(--err)" }}>
              Couldn&apos;t send your request. Please try again in a moment.
            </p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full py-3 rounded-lg font-semibold disabled:opacity-60"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            {status === "submitting" ? "Sending…" : "Request my free quote"}
          </button>
          <p className="form-note">No pressure. Just a straightforward conversation about the work.</p>
        </form>
        </div>

        <footer className="text-center text-sm mt-5 mb-6" style={{ color: "var(--muted)" }}>
          {hasPhone() && <a className="focus-ring" href={`tel:${businessConfig.phone}`}>{businessConfig.phone}</a>}
          {hasPhone() && hasEmail() && <span> · </span>}
          {hasEmail() && <a className="focus-ring" href={`mailto:${businessConfig.email}`}>{businessConfig.email}</a>}
        </footer>
      </div>
      <div className="mobile-actions">
        <a href={`tel:${businessConfig.phone}`}>Call</a>
        <a href={`sms:${businessConfig.phone.replace(/\D/g, "")}`}>Text</a>
        <a href="#quote">Free quote</a>
      </div>
    </main>
  );
}
