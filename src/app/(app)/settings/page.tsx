"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Profile {
  email: string;
  full_name: string | null;
  plan: string;
  subscription_status: string;
  current_period_end: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("email, full_name, plan, subscription_status, current_period_end")
        .eq("id", session.user.id)
        .single();

      if (profileData) setProfile(profileData);

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account
        </p>
      </div>

      {/* Account Info */}
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
        <h2 className="mb-4 font-semibold">Account</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted">Name</label>
            <p className="text-sm">{profile?.full_name || "\u2014"}</p>
          </div>
          <div>
            <label className="text-xs text-muted">Email</label>
            <p className="text-sm">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
        <h2 className="mb-4 font-semibold">Quick Links</h2>
        <div className="space-y-2">
          <a href="/billing" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition hover:bg-accent/5">
            <span>Billing & Subscription</span>
            <svg className="h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <a href="/usage" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition hover:bg-accent/5">
            <span>Usage & Limits</span>
            <svg className="h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
