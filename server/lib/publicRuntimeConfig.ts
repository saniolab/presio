import { endDeletesPresentation, envFlag } from "./flags.js";

/** Public client settings. Never put service-role keys or JWT secrets here. */
export type PublicRuntimeConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  sentryDsn: string;
  githubOAuth: boolean;
  authentikOAuth: boolean;
  emailAuth: boolean;
  publicSignup: boolean;
  branding: boolean;
  endDeletes: boolean;
};

export function publicRuntimeConfig(): PublicRuntimeConfig {
  const emailAuth = envFlag(process.env.ENABLE_EMAIL_SIGNUP, true);
  return {
    supabaseUrl: (process.env.SUPABASE_URL ?? "").trim(),
    supabaseAnonKey: (process.env.SUPABASE_ANON_KEY ?? process.env.ANON_KEY ?? "").trim(),
    sentryDsn: (process.env.VITE_SENTRY_DSN ?? "").trim(),
    githubOAuth: envFlag(process.env.VITE_AUTH_GITHUB ?? process.env.GITHUB_ENABLED, true),
    authentikOAuth: envFlag(
      process.env.VITE_AUTH_AUTHENTIK ?? process.env.AUTHENTIK_ENABLED,
      false,
    ),
    emailAuth,
    publicSignup: emailAuth && envFlag(process.env.ENABLE_PUBLIC_SIGNUP, false),
    branding: envFlag(process.env.VITE_BRANDING, true),
    endDeletes: endDeletesPresentation(),
  };
}

export function publicRuntimeConfigScript(): string {
  const json = JSON.stringify(publicRuntimeConfig()).replace(/</g, "\\u003c");
  return `window.__PRESIO_CONFIG__=${json};`;
}
