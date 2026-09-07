// Build-time Vite flags. Unset / empty uses `defaultOn`.
export function viteFlag(value: unknown, defaultOn: boolean): boolean {
  if (value === undefined || value === "") return defaultOn;
  const normalized = String(value).trim().toLowerCase();
  if (["false", "0", "off", "no"].includes(normalized)) return false;
  if (["true", "1", "on", "yes"].includes(normalized)) return true;
  return defaultOn;
}

// Marketing chrome (homepage pitch, newsletter, install prompt, wordmark).
// Default on so public Presio is unchanged; set VITE_BRANDING=false for a
// white-label embed. Vite inlines this at build time — rebuild after changing.
export const brandingEnabled = viteFlag(import.meta.env.VITE_BRANDING, true);

export const appTitle = brandingEnabled ? "Presio" : "Presentations";
