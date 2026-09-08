import { afterEach, describe, expect, it } from "vitest";
import {
  publicRuntimeConfig,
  publicRuntimeConfigScript,
} from "./lib/publicRuntimeConfig.js";

const keys = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "ANON_KEY",
  "SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
  "PRESIO_SERVICE_API_KEY",
  "PRESIO_HANDOFF_JWT_SECRET",
  "VITE_SENTRY_DSN",
  "VITE_BRANDING",
  "GITHUB_ENABLED",
  "AUTHENTIK_ENABLED",
  "PRESIO_END_DELETES",
] as const;

const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    if (original[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original[key];
    }
  }
});

describe("publicRuntimeConfig", () => {
  it("exposes the anon key and supabase URL, never the service role or JWT secret", () => {
    process.env.SUPABASE_URL = "https://supabase.example.test";
    process.env.SUPABASE_ANON_KEY = "anon-public";
    process.env.SERVICE_ROLE_KEY = "super-secret-service-role";
    process.env.JWT_SECRET = "super-secret-jwt";
    process.env.PRESIO_SERVICE_API_KEY = "service-api-key";
    process.env.PRESIO_HANDOFF_JWT_SECRET = "handoff-secret";
    process.env.VITE_SENTRY_DSN = "https://sentry.example/1";
    process.env.VITE_BRANDING = "false";
    process.env.GITHUB_ENABLED = "false";
    process.env.AUTHENTIK_ENABLED = "true";
    process.env.PRESIO_END_DELETES = "false";

    const config = publicRuntimeConfig();
    expect(config.supabaseUrl).toBe("https://supabase.example.test");
    expect(config.supabaseAnonKey).toBe("anon-public");
    expect(config.sentryDsn).toBe("https://sentry.example/1");
    expect(config.branding).toBe(false);
    expect(config.githubOAuth).toBe(false);
    expect(config.authentikOAuth).toBe(true);
    expect(config.endDeletes).toBe(false);

    const script = publicRuntimeConfigScript();
    expect(script).toContain("anon-public");
    expect(script).not.toContain("super-secret-service-role");
    expect(script).not.toContain("super-secret-jwt");
    expect(script).not.toContain("service-api-key");
    expect(script).not.toContain("handoff-secret");
  });
});
