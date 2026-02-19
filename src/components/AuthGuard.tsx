"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import LoadingSpinner from "./LoadingSpinner";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    const checkAuth = async () => {
      const result = await supabase.auth.getSession();
      if (!result.data.session) {
        router.replace("/login");
      } else {
        // Sync session to cookies for server-side auth
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: result.data.session.access_token,
            refresh_token: result.data.session.refresh_token,
            expires_in: result.data.session.expires_in,
          }),
        });
        setAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
        setAuthenticated(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
