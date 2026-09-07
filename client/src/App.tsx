import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { PasswordRecoveryDialog } from "@/components/PasswordRecoveryDialog";
import { appTitle, brandingEnabled } from "@/lib/flags";
import Home from "@/pages/Home";
import Presentation from "@/pages/Presentation";
import Present from "@/pages/Present";
import Start from "@/pages/Start";
import Share from "@/pages/Share";
import ExternalHandoffCallback from "@/pages/ExternalHandoffCallback";

// Lazy: the About page pulls in Shiki (grammars + wasm), so keep it out of the
// initial bundle and load it only when someone visits /about.
const About = lazy(() => import("@/pages/About"));
const CheckerPage = lazy(() => import("@/pages/checker/CheckerPage"));

export default function App() {
  useEffect(() => {
    document.title = appTitle;
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/present" element={<Present />} />
            <Route path="/start/:id" element={<Start />} />
            <Route path="/s/:id" element={<Presentation />} />
            <Route path="/s/:id/share" element={<Share />} />
            <Route path="/auth/handoff/callback" element={<ExternalHandoffCallback />} />
            <Route
              path="/about"
              element={
                brandingEnabled ? (
                  <Suspense fallback={null}><About /></Suspense>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="/check" element={<Suspense fallback={null}><CheckerPage /></Suspense>} />
          </Routes>
          <PasswordRecoveryDialog />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
