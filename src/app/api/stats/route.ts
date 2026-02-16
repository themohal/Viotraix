import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const userId = auth.user.id;

    // Fetch all completed audits with result data
    const { data: audits } = await supabase
      .from("audits")
      .select("id, overall_score, violations_count, industry_type, status, result_json, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const allAudits = audits || [];
    const completedAudits = allAudits.filter((a) => a.status === "completed");

    // --- Stat cards ---
    const totalAudits = allAudits.length;
    const completedCount = completedAudits.length;
    const totalViolations = completedAudits.reduce((sum, a) => sum + (a.violations_count || 0), 0);
    const avgScore =
      completedCount > 0
        ? Math.round(completedAudits.reduce((sum, a) => sum + (a.overall_score || 0), 0) / completedCount)
        : 0;

    // Critical violations count
    let criticalCount = 0;
    for (const audit of completedAudits) {
      const result = audit.result_json as { violations?: Array<{ severity: string }> } | null;
      if (result?.violations) {
        criticalCount += result.violations.filter((v) => v.severity === "critical").length;
      }
    }

    // --- Score trend (last 10 completed audits) ---
    const recentCompleted = completedAudits.slice(-10);
    const scoreTrend = recentCompleted.map((a) => ({
      date: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: a.overall_score || 0,
    }));

    // --- Violations by category ---
    const categoryMap: Record<string, number> = {};
    for (const audit of completedAudits) {
      const result = audit.result_json as { violations?: Array<{ category: string }> } | null;
      if (result?.violations) {
        for (const v of result.violations) {
          categoryMap[v.category] = (categoryMap[v.category] || 0) + 1;
        }
      }
    }
    const violationsByCategory = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // --- Severity breakdown ---
    const severityMap: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const audit of completedAudits) {
      const result = audit.result_json as { violations?: Array<{ severity: string }> } | null;
      if (result?.violations) {
        for (const v of result.violations) {
          if (severityMap[v.severity] !== undefined) {
            severityMap[v.severity]++;
          }
        }
      }
    }
    const severityBreakdown = Object.entries(severityMap).map(([severity, count]) => ({
      severity,
      count,
    }));

    // --- Industry distribution ---
    const industryMap: Record<string, number> = {};
    for (const audit of allAudits) {
      const ind = audit.industry_type || "general";
      industryMap[ind] = (industryMap[ind] || 0) + 1;
    }
    const industryBreakdown = Object.entries(industryMap)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count);

    // --- Monthly audit counts (last 6 months) ---
    const now = new Date();
    const monthlyAudits: Array<{ month: string; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const count = allAudits.filter((a) => {
        const created = new Date(a.created_at);
        return created >= monthStart && created <= monthEnd;
      }).length;
      monthlyAudits.push({ month: monthLabel, count });
    }

    return NextResponse.json({
      totalAudits,
      completedCount,
      totalViolations,
      avgScore,
      criticalCount,
      scoreTrend,
      violationsByCategory,
      severityBreakdown,
      industryBreakdown,
      monthlyAudits,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
