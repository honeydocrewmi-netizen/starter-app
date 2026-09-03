// Kept in lockstep with the `check` constraints in supabase/schema.sql.
// If you change a limit here, change it there too.
export const LIMITS = {
  name: { min: 1, max: 120 },
  email: { max: 254 },
  message: { min: 1, max: 2000 },
  source: { max: 64 },
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type SubmissionInput = {
  name: string;
  email: string;
  message: string;
  source?: string;
  company?: string; // honeypot — must stay empty
};

export type ValidationResult =
  | { ok: true; value: { name: string; email: string; message: string; source: string | null } }
  | { ok: false; errors: Partial<Record<"name" | "email" | "message", string>> };

export function validateSubmission(input: SubmissionInput): ValidationResult {
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim();
  const message = (input.message ?? "").trim();
  const source = (input.source ?? "").trim();

  const e: Partial<Record<"name" | "email" | "message", string>> = {};

  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
    e.name = "Please enter your name.";
  }
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email.max) {
    e.email = "Please enter a valid email address.";
  }
  if (message.length < LIMITS.message.min || message.length > LIMITS.message.max) {
    e.message =
      message.length === 0
        ? "Please add a short message."
        : `Message must be ${LIMITS.message.max} characters or fewer.`;
  }

  if (Object.keys(e).length > 0) {
    return { ok: false, errors: e };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      message,
      source: source.length > 0 ? source.slice(0, LIMITS.source.max) : null,
    },
  };
}
