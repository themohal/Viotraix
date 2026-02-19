"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import ScoreBadge from "@/components/ScoreBadge";
import ViolationItem from "@/components/ViolationItem";
import LoadingSpinner from "@/components/LoadingSpinner";

interface AuditResult {
  overall_score: number;
  summary: string;
  industry_detected: string;
  violations: Array<{
    id: number;
    category: string;
    severity: string;
    title: string;
    description: string;
    location: string;
    recommendation: string;
    regulatory_reference: string;
  }>;
  compliant_areas: string[];
  priority_fixes: string[];
}

interface Audit {
  id: string;
  file_name: string;
  industry_type: string;
  status: string;
  overall_score: number | null;
  violations_count: number;
  result_json: AuditResult | null;
  image_url: string;
  processing_error: string | null;
  pdf_eligible: boolean;
  created_at: string;
}

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userPlan, setUserPlan] = useState<string>("none");

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchAudit = async () => {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };

      // Fetch audit and usage in parallel
      const [auditRes, usageRes] = await Promise.all([
        fetch(`/api/audits/${id}`, { headers }),
        fetch("/api/usage", { headers }),
      ]);

      if (!auditRes.ok) {
        setError("Audit not found");
        setLoading(false);
        return;
      }

      const data = await auditRes.json();
      setAudit(data.audit);

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUserPlan(usageData.plan || "none");
      }

      setLoading(false);

      // Poll if still processing
      if (data.audit.status === "pending" || data.audit.status === "processing") {
        interval = setInterval(async () => {
          const pollRes = await fetch(`/api/audits/${id}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            setAudit(pollData.audit);
            if (
              pollData.audit.status === "completed" ||
              pollData.audit.status === "failed"
            ) {
              clearInterval(interval);
            }
          }
        }, 2000);
      }
    };

    fetchAudit();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id]);

  const isProPlan = userPlan === "pro";
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!audit) return;
    setDownloading(true);
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/audits/${audit.id}/pdf`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to generate PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `viotraix-audit-${audit.file_name.replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{error || "Audit not found"}</p>
      </div>
    );
  }

  const result = audit.result_json;
  const date = new Date(audit.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Audit Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {audit.file_name} &middot; {date}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {audit.status === "completed" && audit.overall_score !== null && (
            <ScoreBadge score={audit.overall_score} />
          )}
          {audit.status === "completed" && audit.pdf_eligible && (
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="btn-secondary text-sm"
            >
              {downloading ? "Generating..." : "Download PDF"}
            </button>
          )}
          {audit.status === "completed" && !audit.pdf_eligible && (
            <a href="/pricing" className="rounded-xl border border-border/60 px-3 py-2 text-xs text-muted-foreground hover:border-accent/50 transition">
              Upgrade to Pro for PDF
            </a>
          )}
        </div>
      </div>

      {/* Processing state */}
      {(audit.status === "pending" || audit.status === "processing") && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/50 p-12 text-center backdrop-blur-sm">
          <LoadingSpinner size="lg" />
          <div>
            <p className="font-medium">Analyzing your image...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Our AI is inspecting the photo for safety violations. This usually takes
              30-60 seconds.
            </p>
          </div>
        </div>
      )}

      {/* Failed state */}
      {audit.status === "failed" && (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-center backdrop-blur-sm">
          <p className="font-medium text-danger">Analysis Failed</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {audit.processing_error || "An error occurred during analysis. Please try again."}
          </p>
        </div>
      )}

      {/* Results */}
      {audit.status === "completed" && result && (
        <>
          {/* Summary */}
          <div className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
            <h2 className="mb-2 font-semibold">Summary</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="rounded-lg border border-border/40 bg-background/50 px-3 py-1.5">
                <span className="text-muted">Industry: </span>
                <span className="capitalize">{result.industry_detected}</span>
              </div>
              <div className="rounded-lg border border-border/40 bg-background/50 px-3 py-1.5">
                <span className="text-muted">Violations: </span>
                <span>{result.violations.length}</span>
              </div>
              <div className="rounded-lg border border-border/40 bg-background/50 px-3 py-1.5">
                <span className="text-muted">Score: </span>
                <span className="font-semibold">{result.overall_score}/100</span>
              </div>
            </div>
          </div>

          {/* Priority Fixes */}
          {result.priority_fixes.length > 0 && (
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 backdrop-blur-sm">
              <h2 className="mb-3 font-semibold text-accent">Priority Fixes</h2>
              <ol className="space-y-2">
                {result.priority_fixes.map((fix, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{fix}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Violations */}
          {result.violations.length > 0 && (
            <div>
              <h2 className="mb-4 font-semibold">
                Violations ({result.violations.length})
              </h2>
              <div className="space-y-4">
                {result.violations.map((violation) => (
                  <ViolationItem key={violation.id} {...violation} showReference={isProPlan} />
                ))}
              </div>
            </div>
          )}

          {/* Compliant Areas */}
          {result.compliant_areas.length > 0 && (
            <div className="rounded-2xl border border-success/20 bg-success/5 p-6 backdrop-blur-sm">
              <h2 className="mb-3 font-semibold text-success">Compliant Areas</h2>
              <ul className="space-y-1">
                {result.compliant_areas.map((area, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-success"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pro upgrade banner */}
          {!isProPlan && (
            <div className="rounded-2xl border border-accent2/30 bg-gradient-to-r from-accent/5 to-accent2/5 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Unlock Pro Features</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upgrade to Pro for PDF export, OSHA/NFPA/FDA regulatory references, priority AI processing, and analytics dashboard.
                  </p>
                  <a
                    href="/pricing"
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110"
                  >
                    Upgrade to Pro — $79/mo
                  </a>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
