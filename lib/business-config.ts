// =====================================================================
// REBRAND HERE. This is the only file you need to touch to make this
// site your own.
//
// Every `PLACEHOLDER.*` value below is a stand-in, not a real fact — it
// intentionally reads as "fill this in" rather than as a plausible real
// value, so nobody mistakes it for the truth. The page checks each field
// against its placeholder and hides or relabels anything still unset
// (see `isPlaceholder` below) instead of rendering a broken `tel:` link
// or a blank space.
// =====================================================================

export const PLACEHOLDER = {
  phone: "ADD YOUR PHONE NUMBER",
  email: "ADD YOUR EMAIL ADDRESS",
} as const;

export const businessConfig = {
  // Brand is one word on the door hanger: HONEYDO CREW.
  name: "HoneyDo Crew",
  tagline: "Ready to tackle your honey-do list.",
  // Shown in the footer once real. Until then, shows the setup banner instead.
  // Confirmed by the captain 2026-09-03. NOTE: the printed door hanger
  // currently shows 734-219-4693, which is WRONG and must be corrected
  // before any print run.
  phone: "734-709-5172" as string,
  // `null` means this business genuinely has no email address — a deliberate
  // answer, not an unfinished one. The page then omits email everywhere
  // silently. Leave it as PLACEHOLDER.email only while the answer is still
  // unknown; that is what triggers the setup banner. HoneyDo Crew runs on
  // phone calls and the quote form, so this is null on purpose as of
  // 2026-09-07. Set it to a real address to show it in the footer.
  email: null as string | null,
  // Single uppercase letter or short initials shown in the logo mark.
  markInitial: "H",
};

export function isPlaceholder(value: string | null): boolean {
  return value !== null && (Object.values(PLACEHOLDER) as string[]).includes(value);
}

// "Is there a real value to display?" — drives the footer and contact lines.
export function hasPhone(): boolean {
  return businessConfig.phone.trim().length > 0 && !isPlaceholder(businessConfig.phone);
}

export function hasEmail(): boolean {
  const { email } = businessConfig;
  return email !== null && email.trim().length > 0 && !isPlaceholder(email);
}

// "Is this still an open question?" — drives the setup banner, and is NOT the
// same as `!hasX()`. A deliberate `null` is answered; a PLACEHOLDER is not.
export function isPhoneUnset(): boolean {
  return businessConfig.phone.trim().length === 0 || isPlaceholder(businessConfig.phone);
}

export function isEmailUnset(): boolean {
  return isPlaceholder(businessConfig.email);
}
