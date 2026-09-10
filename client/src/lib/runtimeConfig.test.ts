import { describe, expect, it } from "vitest";
import { resolveRuntimeConfig, type RuntimeConfig } from "./runtimeConfig";

const vite: RuntimeConfig = {
  supabaseUrl: "https://e2e-placeholder.supabase.co",
  supabaseAnonKey: "vite-anon",
  sentryDsn: "",
  githubOAuth: true,
  authentikOAuth: false,
  emailAuth: true,
  publicSignup: false,
  branding: true,
  endDeletes: true,
};

describe("resolveRuntimeConfig", () => {
  it("keeps the Vite supabase URL when /config.js sends an empty string", () => {
    const config = resolveRuntimeConfig(vite, { supabaseUrl: "", supabaseAnonKey: "" });
    expect(config.supabaseUrl).toBe(vite.supabaseUrl);
    expect(config.supabaseAnonKey).toBe(vite.supabaseAnonKey);
  });

  it("uses a non-empty runtime supabase URL over Vite", () => {
    const config = resolveRuntimeConfig(vite, {
      supabaseUrl: "https://presio.example.test",
    });
    expect(config.supabaseUrl).toBe("https://presio.example.test");
  });

  it("lets runtime booleans hide public signup without touching the URL", () => {
    const config = resolveRuntimeConfig(vite, { publicSignup: false, emailAuth: true });
    expect(config.supabaseUrl).toBe(vite.supabaseUrl);
    expect(config.publicSignup).toBe(false);
    expect(config.emailAuth).toBe(true);
  });
});
