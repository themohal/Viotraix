"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
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

interface Stats {
  totalAudits: number;
  completedCount: number;
  totalViolations: number;
  monthlyAudits: Array<{ month: string; count: number }>;
}

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [usageRes, statsRes] = await Promise.all([
        fetch("/api/usage", { headers }),
        fetch("/api/stats", { headers }),
      ]);

      if (usageRes.ok) {
        const data = await usageRes.json();
        setUsage(data);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
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

  const maxMonthlyValue = stats
    ? Math.max(...stats.monthlyAudits.map((m) => m.count), 1)
    : 1;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Usage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your audit usage and limits
        </p>
      </div>

      {/* Current Usage */}
      {usage && (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Current Period</h2>
            <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent capitalize">
              {usage.plan} plan
            </span>
          </div>

          {usage.expired ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-sm text-amber-300">
                Your subscription has expired. Renew to continue using services.
              </p>
              <a
                href="/pricing"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110"
              >
                Renew Subscription
              </a>
            </div>
          ) : usage.canAudit ? (
            <UsageMeter
              used={usage.auditsUsed}
              limit={usage.auditsLimit}
              label="Audits this period"
            />
          ) : usage.plan !== "none" ? (
            <div className="rounded-xl border border-danger/20 bg-danger/10 p-3">
              <p className="text-sm text-danger">
                You&apos;ve used all {usage.auditsLimit} audits for this billing period.
              </p>
              <a
                href="/pricing"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110"
              >
                Upgrade Plan
              </a>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No active plan. <a href="/pricing" className="text-accent hover:underline">Get started</a> to begin running audits.
            </div>
          )}
        </div>
      )}

      {/* Usage Stats */}
      {stats && (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
          <h2 className="mb-4 font-semibold">All Time</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalAudits}</p>
              <p className="text-xs text-muted-foreground">Total Audits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalViolations}</p>
              <p className="text-xs text-muted-foreground">Violations Found</p>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Chart */}
      {stats && stats.monthlyAudits.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
          <h2 className="mb-4 font-semibold">Monthly Audits</h2>
          <div className="flex h-40 items-end gap-2">
            {stats.monthlyAudits.map((m, i) => (
              <div key={i} className="group relative flex flex-1 flex-col items-center">
                <div className="absolute -top-6 hidden rounded bg-card border border-border/60 px-2 py-0.5 text-xs font-medium group-hover:block">
                  {m.count}
                </div>
                <div
                  className="w-full rounded-t bg-accent transition-all duration-300"
                  style={{ height: m.count > 0 ? `${(m.count / maxMonthlyValue) * 100}%` : "4px", minHeight: "4px" }}
                />
                <span className="mt-1.5 text-[10px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
