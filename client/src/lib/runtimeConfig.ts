function viteFlag(value: unknown, defaultOn: boolean): boolean {
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

export type RuntimeConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  sentryDsn: string;
  githubOAuth: boolean;
  authentikOAuth: boolean;
  branding: boolean;
  endDeletes: boolean;
};

declare global {
  interface Window {
    __PRESIO_CONFIG__?: Partial<RuntimeConfig>;
  }
}

function fromVite(): RuntimeConfig {
  return {
    supabaseUrl: String(import.meta.env.VITE_SUPABASE_URL ?? ""),
    supabaseAnonKey: String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? ""),
    sentryDsn: String(import.meta.env.VITE_SENTRY_DSN ?? ""),
    githubOAuth: viteFlag(import.meta.env.VITE_AUTH_GITHUB, true),
    authentikOAuth: viteFlag(import.meta.env.VITE_AUTH_AUTHENTIK, false),
    branding: viteFlag(import.meta.env.VITE_BRANDING, true),
    endDeletes: viteFlag(import.meta.env.VITE_END_DELETES, true),
  };
}

function fromWindow(): Partial<RuntimeConfig> {
  if (typeof window === "undefined") {
    return {};
  }
  return window.__PRESIO_CONFIG__ ?? {};
}

function pickString(runtime: string | undefined, fallback: string): string {
  if (runtime === undefined) {
    return fallback;
  }
  return runtime;
}

function pickBool(runtime: boolean | undefined, fallback: boolean): boolean {
  if (runtime === undefined) {
    return fallback;
  }
  return runtime;
}

const vite = fromVite();
const runtime = fromWindow();

export const runtimeConfig: RuntimeConfig = {
  supabaseUrl: pickString(runtime.supabaseUrl, vite.supabaseUrl),
  supabaseAnonKey: pickString(runtime.supabaseAnonKey, vite.supabaseAnonKey),
  sentryDsn: pickString(runtime.sentryDsn, vite.sentryDsn),
  githubOAuth: pickBool(runtime.githubOAuth, vite.githubOAuth),
  authentikOAuth: pickBool(runtime.authentikOAuth, vite.authentikOAuth),
  branding: pickBool(runtime.branding, vite.branding),
  endDeletes: pickBool(runtime.endDeletes, vite.endDeletes),
};
