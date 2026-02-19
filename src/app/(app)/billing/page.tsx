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

interface UsageData {
  auditsUsed: number;
  auditsLimit: number;
  plan: string;
  canAudit: boolean;
  expired?: boolean;
  expiredAt?: string | null;
}

export default function BillingPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const [profileRes, usageRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("email, full_name, plan, subscription_status, current_period_end")
          .eq("id", session.user.id)
          .single(),
        fetch("/api/usage", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
      }

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

  const planLabel: Record<string, string> = {
    single: "Single Audit ($4.99)",
    basic: "Basic ($29/mo)",
    pro: "Pro ($79/mo)",
  };

  // Use usage.plan as source of truth (handles admin bypass + actual usage state)
  const effectivePlan = usage?.plan || profile?.plan || "none";
  const currentPlanLabel = planLabel[effectivePlan] || "No active plan";

  const isActive = usage?.canAudit || profile?.subscription_status === "active";

  const periodEnd = profile?.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
        <h2 className="mb-4 font-semibold">Subscription</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs text-muted">Current Plan</label>
              <p className="text-sm font-medium">{currentPlanLabel}</p>
            </div>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                usage?.expired
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                  : isActive
                  ? "border-success/20 bg-success/10 text-success"
                  : profile?.subscription_status === "cancelled"
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                  : "border-border/40 bg-muted/10 text-muted"
              }`}
            >
              {usage?.expired
                ? "Expired"
                : isActive
                ? "Active"
                : profile?.subscription_status === "cancelled"
                ? "Cancelled"
                : "Inactive"}
            </span>
          </div>

          {usage?.expired && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-sm text-amber-300">
                Your subscription expired{usage.expiredAt ? ` on ${new Date(usage.expiredAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}. Renew to continue using services.
              </p>
            </div>
          )}

          {periodEnd && !usage?.expired && (
            <div>
              <label className="text-xs text-muted">Current Period Ends</label>
              <p className="text-sm">{periodEnd}</p>
            </div>
          )}

          {(usage?.expired || effectivePlan === "none" || effectivePlan === "free") && (
            <a
              href="/pricing"
              className="btn-primary mt-2 inline-block text-sm"
            >
              {usage?.expired ? "Renew Subscription" : "Upgrade Plan"}
            </a>
          )}
        </div>
      </div>

      {/* Payment History Info */}
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
        <h2 className="mb-4 font-semibold">Payment Info</h2>
        <p className="text-sm text-muted-foreground">
          All payments are processed securely through Lemon Squeezy. To manage your payment method, view invoices, or cancel your subscription, please use the Lemon Squeezy customer portal.
        </p>
      </div>
    </div>
  );
}
