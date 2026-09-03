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
  email: PLACEHOLDER.email as string,
  // Single uppercase letter or short initials shown in the logo mark.
  markInitial: "H",
};

export function isPlaceholder(value: string): boolean {
  return (Object.values(PLACEHOLDER) as string[]).includes(value);
}

export function hasPhone(): boolean {
  return businessConfig.phone.trim().length > 0 && !isPlaceholder(businessConfig.phone);
}

export function hasEmail(): boolean {
  return businessConfig.email.trim().length > 0 && !isPlaceholder(businessConfig.email);
}
