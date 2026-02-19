import Link from "next/link";
import ScoreBadge from "./ScoreBadge";

interface AuditCardProps {
  id: string;
  fileName: string;
  auditName?: string | null;
  imageCount?: number;
  industryType: string;
  status: string;
  overallScore: number | null;
  violationsCount: number;
  createdAt: string;
  onDelete?: (id: string) => void;
}

export default function AuditCard({
  id,
  fileName,
  auditName,
  imageCount = 1,
  industryType,
  status,
  overallScore,
  violationsCount,
  createdAt,
  onDelete,
}: AuditCardProps) {
  const date = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const canDelete = status === "completed" || status === "failed";

  return (
    <div className="group relative flex items-center gap-4 rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-accent/20 hover:bg-card-hover hover:shadow-lg hover:shadow-accent/5">
      <Link
        href={`/audits/${id}`}
        className="flex flex-1 items-center gap-4"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/15 to-accent2/10 text-accent transition-transform duration-300 group-hover:scale-105">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{auditName || fileName || "Untitled"}</p>
            <span className="shrink-0 rounded-lg bg-accent/5 border border-accent/10 px-2 py-0.5 text-xs text-accent capitalize">
              {industryType}
            </span>
            {imageCount > 1 && (
              <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                {imageCount} photos
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
            <span>{date}</span>
            {status === "completed" && (
              <span>{violationsCount} violation{violationsCount !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {status === "completed" && overallScore !== null ? (
            <ScoreBadge score={overallScore} />
          ) : status === "processing" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Processing
            </span>
          ) : status === "failed" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
              Failed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/10 px-3 py-1 text-xs font-semibold text-muted">
              Pending
            </span>
          )}
        </div>
      </Link>

      {canDelete && onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(id);
          }}
          className="shrink-0 rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
          title="Delete audit"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
