import { runtimeConfig } from "@/lib/runtimeConfig";

// Build-time Vite flags. Unset / empty uses `defaultOn`.
export function viteFlag(value: unknown, defaultOn: boolean): boolean {
  if (value === undefined || value === "") {
    return defaultOn;
  }
  const normalized = String(value).trim().toLowerCase();
  if (["false", "0", "off", "no"].includes(normalized)) {
    return false;
  }
  if (["true", "1", "on", "yes"].includes(normalized)) {
    return true;
  }
  return defaultOn;
}

// Marketing chrome (homepage pitch, newsletter, install prompt, wordmark).
// Default on so public Presio is unchanged; set VITE_BRANDING=false for a
// white-label embed. Served from /config.js at runtime so a pulled image
// does not need a rebuild.
export const brandingEnabled = runtimeConfig.branding;

export const appTitle = brandingEnabled ? "Presio" : "Presentations";

// Whether "End Presentation" / recents Close deletes the deck (IndexedDB for
// local, DELETE /api/sessions/:id for synced). Default on so public Presio is
// unchanged. Set VITE_END_DELETES=false (and PRESIO_END_DELETES=false) to only
// stop the live session.
export const endDeletesPresentation = runtimeConfig.endDeletes;
