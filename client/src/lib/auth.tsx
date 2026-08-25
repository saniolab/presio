import { useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { authEnabled } from "@/lib/authMode";
import { AuthContext, type AuthContextValue } from "@/lib/useAuth";

// Dev-only: set VITE_DEV_USER (e.g. "dev@example.com") to start signed in as a
// fake user. Lets us exercise the logged-in UI without a real Supabase session.
const devUser: User | null =
  import.meta.env.DEV && import.meta.env.VITE_DEV_USER
    ? ({ id: "dev-user", email: import.meta.env.VITE_DEV_USER } as User)
    : null;

// OAuth/email redirect target: origin + path only.
// GoTrue appends tokens as a `#…` fragment — a leftover `#` in the target
// doubles up and makes them unparseable. Query string is also unsafe: if the
// user retries login from `?error=bad_oauth_state&…`, that error is sent as
// redirect_to and supabase-js treats the successful return as a failed OAuth.
const currentPageUrl = () => window.location.origin + window.location.pathname;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // Nothing to load when auth is disabled (no Supabase) — don't sit in a
  // loading state or fire requests at the placeholder URL.
  const [loading, setLoading] = useState(authEnabled && !devUser);
  // Set when the user lands here from a password-reset email; the app shows a
  // "choose a new password" dialog until it's cleared.
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  // GoTrue reports email-link failures (expired, already used) as fragment
  // params on the redirect. Surface them — otherwise a dead link just lands on
  // the page with no explanation.
  const [authLinkError, setAuthLinkError] = useState<string | null>(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const msg = hash.get("error_description") ?? query.get("error_description");
    if (msg || query.get("error")) {
      // Drop error query/hash so a retry does not send them as redirect_to.
      window.history.replaceState(null, "", window.location.pathname);
    }
    return msg;
  });

  useEffect(() => {
    if (devUser || !authEnabled) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user: devUser ?? session?.user ?? null,
    session,
    loading,
    signInWithOAuth: async (provider, redirectTo) => {
      const { error } = await supabase.auth.signInWithOAuth({
        // custom:authentik is a GoTrue custom provider, not in the built-in union.
        provider: provider as "github",
        options: {
          redirectTo: redirectTo ?? currentPageUrl(),
          ...(provider === "custom:authentik" ? { scopes: "openid email profile" } : {}),
        },
      });
      if (error) throw error;
    },
    signInWithPassword: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUp: async (email, password) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        // Send the confirmation link back to where the user signed up, not home.
        options: { emailRedirectTo: currentPageUrl() },
      });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    resetPassword: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: currentPageUrl(),
      });
      if (error) throw error;
    },
    verifyResetCode: async (email, code) => {
      // Same recovery session as clicking the email link, minus the redirect —
      // works even when a mail scanner has prefetched (voided) the link.
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "recovery" });
      if (error) throw error;
      setPasswordRecovery(true);
    },
    updatePassword: async (password) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    passwordRecovery,
    clearPasswordRecovery: () => setPasswordRecovery(false),
    authLinkError,
    clearAuthLinkError: () => setAuthLinkError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
