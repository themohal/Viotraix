"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
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

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [session, setSession] = useState<{ access_token: string } | null>(null);

  useEffect(() => {
    const fetchAudits = async () => {
      setLoading(true);
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;
      setSession(session);

      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (industryFilter) params.set("industry", industryFilter);

      const res = await fetch(`/api/audits?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAudits(data.audits || []);
      }

      setLoading(false);
    };

    fetchAudits();
  }, [statusFilter, industryFilter]);

  const handleDelete = async (auditId: string) => {
    if (!session || !confirm("Delete this audit? This cannot be undone.")) return;

    const res = await fetch(`/api/audits/${auditId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      setAudits((prev) => prev.filter((a) => a.id !== auditId));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Audits</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and filter your safety audit history
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field max-w-[160px]"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="input-field max-w-[160px]"
        >
          <option value="">All Industries</option>
          <option value="restaurant">Restaurant</option>
          <option value="construction">Construction</option>
          <option value="warehouse">Warehouse</option>
          <option value="retail">Retail</option>
          <option value="office">Office</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : audits.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-8 text-center text-sm text-muted-foreground backdrop-blur-sm">
          No audits found. Try adjusting your filters or upload a new photo.
        </div>
      ) : (
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
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
