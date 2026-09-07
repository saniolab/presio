import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { setSessionAuth } from "@/lib/utils";

// Exchanges a short-lived JWT from a trusted external presentation system for
// this session's controller credentials, without requiring a Presio account.
export default function ExternalHandoffCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const requestedSession = searchParams.get("session") || "";
  const [loadError, setLoadError] = useState("");
  const error = !token ? "The presentation handoff link is incomplete." : loadError;

  useEffect(() => {
    let cancelled = false;
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/auth/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          throw new Error("The presentation handoff link expired or is invalid.");
        }
        const data = (await res.json()) as {
          sessionId: string;
          controllerToken: string;
          passphrase: string;
        };
        if (requestedSession && requestedSession !== data.sessionId) {
          throw new Error("The handoff link is for a different presentation.");
        }
        setSessionAuth(data.sessionId, {
          controllerToken: data.controllerToken,
          passphrase: data.passphrase,
        });
        if (!cancelled) {
          navigate(`/s/${data.sessionId}?role=controller`, { replace: true });
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "The presentation handoff failed.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, requestedSession, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 space-y-4 text-center">
            <p className="text-3xl">😕</p>
            <h2 className="text-lg font-semibold">{error}</h2>
            <Button asChild className="w-full">
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Opening presentation…</p>
    </div>
  );
}
