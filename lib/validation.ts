// Kept in lockstep with the `check` constraints in supabase/schema.sql.
// If you change a limit or an allowed enum value here, change it there too.
export const LIMITS = {
  name: { min: 1, max: 120 },
  phone: { min: 7, max: 30 },
  email: { max: 254 },
  address: { min: 1, max: 300 },
  notes: { max: 2000 },
  source: { max: 64 },
};

export const SERVICE_OPTIONS = ["gutters", "roof", "yard"] as const;
export type Service = (typeof SERVICE_OPTIONS)[number];

export const STOREY_OPTIONS = ["1", "2", "3+"] as const;
export type Storeys = (typeof STOREY_OPTIONS)[number];

export const TREE_OPTIONS = ["none", "a-few", "a-lot"] as const;
export type Trees = (typeof TREE_OPTIONS)[number];

export const URGENCY_OPTIONS = ["asap", "this-month", "just-pricing"] as const;
export type Urgency = (typeof URGENCY_OPTIONS)[number];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Loose on purpose: accepts digits, spaces, parens, dashes, a leading +.
const PHONE_RE = /^[0-9+()\-.\s]+$/;

export type SubmissionInput = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  services: string[];
  storeys?: string;
  trees?: string;
  urgency?: string;
  notes?: string;
  source?: string;
  company?: string; // honeypot — must stay empty
};

export type ValidatedSubmission = {
  name: string;
  phone: string;
  email: string | null;
  address: string;
  services: Service[];
  storeys: Storeys | null;
  trees: Trees | null;
  urgency: Urgency | null;
  notes: string | null;
  source: string | null;
};

export type ValidationResult =
  | { ok: true; value: ValidatedSubmission }
  | { ok: false; errors: Partial<Record<"name" | "phone" | "email" | "address" | "services", string>> };

function asEnum<T extends string>(value: string | undefined, allowed: readonly T[]): T | null {
  const v = (value ?? "").trim();
  return (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

export function validateSubmission(input: SubmissionInput): ValidationResult {
  const name = (input.name ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const email = (input.email ?? "").trim();
  const address = (input.address ?? "").trim();
  const notes = (input.notes ?? "").trim();
  const source = (input.source ?? "").trim();
  const services = Array.from(new Set((input.services ?? []).map((s) => s.trim()))).filter((s) =>
    (SERVICE_OPTIONS as readonly string[]).includes(s),
  ) as Service[];

  const e: Partial<Record<"name" | "phone" | "email" | "address" | "services", string>> = {};

  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
    e.name = "Please enter your name.";
  }
  if (
    phone.length < LIMITS.phone.min ||
    phone.length > LIMITS.phone.max ||
    !PHONE_RE.test(phone)
  ) {
    e.phone = "Please enter a phone number we can call back.";
  }
  if (email.length > 0 && (!EMAIL_RE.test(email) || email.length > LIMITS.email.max)) {
    e.email = "Please enter a valid email address, or leave it blank.";
  }
  if (address.length < LIMITS.address.min || address.length > LIMITS.address.max) {
    e.address = "Please enter the address the work is at.";
  }
  if (services.length === 0) {
    e.services = "Pick at least one service.";
  }

  if (Object.keys(e).length > 0) {
    return { ok: false, errors: e };
  }

  return {
    ok: true,
    value: {
      name,
      phone,
      email: email.length > 0 ? email : null,
      address,
      services,
      storeys: asEnum(input.storeys, STOREY_OPTIONS),
      trees: asEnum(input.trees, TREE_OPTIONS),
      urgency: asEnum(input.urgency, URGENCY_OPTIONS),
      notes: notes.length > 0 ? notes.slice(0, LIMITS.notes.max) : null,
      source: source.length > 0 ? source.slice(0, LIMITS.source.max) : null,
    },
  };
}
