// Runtime boolean env flags. Unset / empty uses `defaultOn`.
export function envFlag(value: unknown, defaultOn: boolean): boolean {
  if (value === undefined || value === "") return defaultOn;
  const normalized = String(value).trim().toLowerCase();
  if (["false", "0", "off", "no"].includes(normalized)) return false;
  if (["true", "1", "on", "yes"].includes(normalized)) return true;
  return defaultOn;
}

// Whether "End Presentation" / DELETE /api/sessions/:id destroys the deck.
// Default on so public Presio is unchanged. Set PRESIO_END_DELETES=false (or
// VITE_END_DELETES=false) to only disconnect viewers and leave PDF + row intact.
export function endDeletesPresentation(): boolean {
  return envFlag(process.env.PRESIO_END_DELETES ?? process.env.VITE_END_DELETES, true);
}
