import { runtimeConfig } from "@/lib/runtimeConfig";

// Whether accounts / login are available. Auth is backed by Supabase (GoTrue).
// Offline / local-mode images leave supabaseUrl empty so there is no provider.
//
// When auth is disabled we hide the login UI entirely — a login button that
// can only fail is worse than none — and unlock the features that were gated
// on login solely to attach an account. Drawing (strokes sync over Socket.IO,
// authorized by the controller token, not a session) and notes editing (a
// local session rewrites its PDF in IndexedDB) both work with no account, so
// there's nothing to sign in for.
export const authEnabled = Boolean(runtimeConfig.supabaseUrl);

// OAuth buttons follow /config.js (or Vite env in `npm run dev`). Unset
// GitHub keeps the historical button; Authentik is opt-in.
export const githubOAuthEnabled = runtimeConfig.githubOAuth;
export const authentikOAuthEnabled = runtimeConfig.authentikOAuth;
export const emailAuthEnabled = runtimeConfig.emailAuth;
export const publicSignupEnabled = runtimeConfig.publicSignup;
