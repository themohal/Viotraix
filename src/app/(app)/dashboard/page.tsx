"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase";
import UsageMeter from "@/components/UsageMeter";
import AuditCard from "@/components/AuditCard";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Audit {
  id: string;
  file_name: string;
  industry_type: string;
  status: string;
  overall_score: number | null;
  violations_count: number;
  created_at: string;
}

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
  avgScore: number;
  criticalCount: number;
  scoreTrend: Array<{ date: string; score: number }>;
  violationsByCategory: Array<{ category: string; count: number }>;
  severityBreakdown: Array<{ severity: string; count: number }>;
  industryBreakdown: Array<{ industry: string; count: number }>;
  monthlyAudits: Array<{ month: string; count: number }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  fire_safety: "Fire Safety",
  electrical: "Electrical",
  ergonomic: "Ergonomic",
  slip_trip_fall: "Slip/Trip/Fall",
  chemical: "Chemical",
  ppe: "PPE",
  structural: "Structural",
  hygiene: "Hygiene",
  emergency_exit: "Emergency Exit",
  general: "General",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-blue-400",
};

const SEVERITY_BG: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400",
  high: "bg-orange-500/15 text-orange-400",
  medium: "bg-amber-500/15 text-amber-400",
  low: "bg-blue-400/15 text-blue-400",
};

export default function DashboardPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
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

      const [auditsRes, usageRes, statsRes] = await Promise.all([
        fetch("/api/audits?limit=5", { headers }),
        fetch("/api/usage", { headers }),
        fetch("/api/stats", { headers }),
      ]);

      if (auditsRes.ok) {
        const data = await auditsRes.json();
        setAudits(data.audits || []);
      }

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

  const maxBarValue = stats
    ? Math.max(...stats.violationsByCategory.map((v) => v.count), 1)
    : 1;

  const maxMonthlyValue = stats
    ? Math.max(...stats.monthlyAudits.map((m) => m.count), 1)
    : 1;

  const maxScore = stats
    ? Math.max(...stats.scoreTrend.map((s) => s.score), 100)
    : 100;

  const totalSeverity = stats
    ? stats.severityBreakdown.reduce((sum, s) => sum + s.count, 0)
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your workplace safety audits
          </p>
        </div>
        <Link
          href="/new-audit"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Audit
        </Link>
      </div>

      {/* Expired / No Plan Banner */}
      {usage && (usage.plan === "expired" || usage.expired) && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="font-semibold text-amber-300">Subscription Expired</h3>
              <p className="mt-1 text-sm text-amber-200/80">
                Renew your plan to continue using audit services.
              </p>
              <a href="/pricing" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110">
                Renew Subscription
              </a>
            </div>
          </div>
        </div>
      )}

      {usage && usage.plan === "none" && !usage.expired && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-accent">No Active Plan</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Purchase a plan to start running AI safety audits.
              </p>
              <a href="/pricing" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110">
                View Plans
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <svg className="h-5 w-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalAudits || 0}</p>
              <p className="text-xs text-muted-foreground">Total Audits</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.avgScore || 0}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalViolations || 0}</p>
              <p className="text-xs text-muted-foreground">Total Violations</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.criticalCount || 0}</p>
              <p className="text-xs text-muted-foreground">Critical Issues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Meter */}
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

      {/* Charts Row */}
      {stats && stats.completedCount > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Score Trend Chart */}
          {stats.scoreTrend.length > 1 && (
            <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
              <h2 className="mb-4 font-semibold">Score Trend</h2>
              <div className="flex h-48 items-end gap-1">
                {stats.scoreTrend.map((point, i) => (
                  <div key={i} className="group relative flex flex-1 flex-col items-center">
                    <div className="absolute -top-6 hidden rounded bg-card border border-border/60 px-2 py-0.5 text-xs font-medium group-hover:block">
                      {point.score}
                    </div>
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        point.score >= 80 ? "bg-emerald-500" : point.score >= 60 ? "bg-amber-500" : point.score >= 40 ? "bg-orange-500" : "bg-red-500"
                      }`}
                      style={{ height: `${(point.score / maxScore) * 100}%`, minHeight: "4px" }}
                    />
                    <span className="mt-1.5 text-[10px] text-muted-foreground">{point.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Audits Chart */}
          <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
            <h2 className="mb-4 font-semibold">Monthly Audits</h2>
            <div className="flex h-48 items-end gap-2">
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
        </div>
      )}

      {/* Second Charts Row */}
      {stats && stats.completedCount > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Violations by Category */}
          {stats.violationsByCategory.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
              <h2 className="mb-4 font-semibold">Violations by Category</h2>
              <div className="space-y-3">
                {stats.violationsByCategory.slice(0, 8).map((item) => (
                  <div key={item.category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-border/30">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-all duration-500"
                        style={{ width: `${(item.count / maxBarValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Severity Breakdown */}
          {totalSeverity > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
              <h2 className="mb-4 font-semibold">Severity Breakdown</h2>

              {/* Donut-style ring */}
              <div className="mb-5 flex justify-center">
                <div className="relative h-40 w-40">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                    {(() => {
                      let offset = 0;
                      const colors: Record<string, string> = {
                        critical: "#ef4444",
                        high: "#f97316",
                        medium: "#f59e0b",
                        low: "#60a5fa",
                      };
                      return stats.severityBreakdown.map((s) => {
                        const pct = totalSeverity > 0 ? (s.count / totalSeverity) * 100 : 0;
                        const el = (
                          <circle
                            key={s.severity}
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke={colors[s.severity] || "#666"}
                            strokeWidth="4"
                            strokeDasharray={`${pct} ${100 - pct}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                          />
                        );
                        offset += pct;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{totalSeverity}</span>
                    <span className="text-[10px] text-muted-foreground">total</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2">
                {stats.severityBreakdown.map((s) => (
                  <div key={s.severity} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${SEVERITY_COLORS[s.severity]}`} />
                    <span className="text-sm capitalize text-muted-foreground">{s.severity}</span>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_BG[s.severity]}`}>
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Industry Breakdown */}
      {stats && stats.industryBreakdown.length > 1 && (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
          <h2 className="mb-4 font-semibold">Audits by Industry</h2>
          <div className="flex flex-wrap gap-3">
            {stats.industryBreakdown.map((item) => (
              <div
                key={item.industry}
                className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/50 px-4 py-2.5"
              >
                <span className="text-sm capitalize text-muted-foreground">{item.industry}</span>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats && stats.totalAudits === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <svg className="h-8 w-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">No audits yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a workplace photo to get your first AI safety audit.
          </p>
          <Link
            href="/new-audit"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start Your First Audit
          </Link>
        </div>
      )}

      {/* Recent Audits */}
      {audits.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent Audits</h2>
            <Link href="/audits" className="text-sm text-accent hover:text-accent-hover transition">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {audits.map((audit) => (
              <AuditCard
                key={audit.id}
                id={audit.id}
                fileName={audit.file_name}
                industryType={audit.industry_type}
                status={audit.status}
                overallScore={audit.overall_score}
                violationsCount={audit.violations_count}
                createdAt={audit.created_at}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
