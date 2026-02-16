"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import UploadZone from "@/components/UploadZone";
import UsageMeter from "@/components/UsageMeter";
import LoadingSpinner from "@/components/LoadingSpinner";

interface UsageData {
  auditsUsed: number;
  auditsLimit: number;
  plan: string;
  canAudit: boolean;
  expired?: boolean;
  expiredAt?: string | null;
}

export default function NewAuditPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const res = await fetch("/api/usage", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }

      setLoading(false);
    };

    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">New Audit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload or capture a workplace photo for AI safety analysis
        </p>
      </div>

      {/* Expired Banner */}
      {usage && (usage.plan === "expired" || usage.expired) && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="font-semibold text-amber-300">Subscription Expired</h3>
              <p className="mt-1 text-sm text-amber-200/80">
                Your subscription has expired{usage.expiredAt ? ` on ${new Date(usage.expiredAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}. Renew your plan to continue using audit services.
              </p>
              <a
                href="/pricing"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110"
              >
                Renew Subscription
              </a>
            </div>
          </div>
        </div>
      )}

      {/* No Plan Banner */}
      {usage && usage.plan === "none" && !usage.expired && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-accent">No Active Plan</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Purchase a plan to start running AI safety audits on your workplace photos.
              </p>
              <a
                href="/pricing"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110"
              >
                View Plans
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Usage */}
      {usage && usage.canAudit && (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Usage</h2>
            <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent capitalize">
              {usage.plan} plan
            </span>
          </div>
          <UsageMeter
            used={usage.auditsUsed}
            limit={usage.auditsLimit}
            label="Audits this period"
          />
        </div>
      )}

      {/* Upload Zone */}
      {usage && usage.canAudit ? (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
          <UploadZone />
        </div>
      ) : usage && !usage.canAudit && usage.plan !== "none" && usage.plan !== "expired" ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-danger">Audit Limit Reached</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You&apos;ve used all {usage.auditsLimit} audits for this billing period. Upgrade your plan for more audits.
              </p>
              <a
                href="/pricing"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110"
              >
                Upgrade Plan
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
