interface ViolationItemProps {
  id: number;
  category: string;
  severity: string;
  title: string;
  description: string;
  location: string;
  recommendation: string;
  regulatory_reference: string;
  showReference?: boolean;
}

const severityColors: Record<string, string> = {
  critical: "border-danger bg-danger/5",
  high: "border-accent bg-accent/5",
  medium: "border-warning bg-warning/5",
  low: "border-info bg-info/5",
};

const severityBadge: Record<string, string> = {
  critical: "bg-danger/10 text-danger border-danger/20",
  high: "bg-accent/10 text-accent border-accent/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-info/10 text-info border-info/20",
};

const categoryLabels: Record<string, string> = {
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

export default function ViolationItem({
  id,
  category,
  severity,
  title,
  description,
  location,
  recommendation,
  regulatory_reference,
  showReference = true,
}: ViolationItemProps) {
  return (
    <div
      className={`rounded-2xl border-l-4 p-6 ${
        severityColors[severity] || "border-border bg-card"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted">#{id}</span>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
              severityBadge[severity] || ""
            }`}
          >
            {severity}
          </span>
          <span className="rounded-lg bg-accent/5 border border-accent/10 px-2 py-0.5 text-xs text-muted-foreground">
            {categoryLabels[category] || category}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>

      <div className="mt-4 space-y-2">
        {location && (
          <div className="flex gap-2 text-sm">
            <span className="shrink-0 font-medium text-muted">Location:</span>
            <span className="text-muted-foreground">{location}</span>
          </div>
        )}
        <div className="flex gap-2 text-sm">
          <span className="shrink-0 font-medium text-muted">Fix:</span>
          <span className="text-muted-foreground">{recommendation}</span>
        </div>
        {regulatory_reference && showReference && (
          <div className="flex gap-2 text-sm">
            <span className="shrink-0 font-medium text-muted">Reference:</span>
            <span className="font-medium text-accent">{regulatory_reference}</span>
          </div>
        )}
        {regulatory_reference && !showReference && (
          <div className="flex gap-2 text-sm">
            <span className="shrink-0 font-medium text-muted">Reference:</span>
            <span className="text-xs italic text-muted">Pro plan required</span>
          </div>
        )}
      </div>
    </div>
  );
}
