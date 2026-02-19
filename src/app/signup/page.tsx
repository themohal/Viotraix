"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";

const REDIRECT_MAP: Record<string, string> = {
  pricing: "/pricing",
  dashboard: "/dashboard",
};

function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Sync session to cookies for server-side auth (if session returned immediately)
      if (data.session) {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_in: data.session.expires_in,
          }),
        });
      }

      const redirectTo = redirectParam && REDIRECT_MAP[redirectParam]
        ? REDIRECT_MAP[redirectParam]
        : "/dashboard";
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/3 top-1/4 h-72 w-72 rounded-full bg-emerald-500/15 blur-[100px]" />
          <div className="absolute right-1/3 bottom-1/4 h-56 w-56 rounded-full bg-amber-500/10 blur-[80px]" />
        </div>

        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-8 shadow-2xl shadow-accent/5 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent2">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-sm text-muted-foreground">
                  Start inspecting your workplace today
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  placeholder="John Smith"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <LoadingSpinner size="sm" />}
                Create Account
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={redirectParam ? `/login?redirect=${redirectParam}` : "/login"}
                className="font-medium text-accent hover:text-accent-hover transition"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
