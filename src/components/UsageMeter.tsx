export default function UsageMeter({
  used,
  limit,
  label = "Audits used",
}: {
  used: number;
  limit: number;
  label?: string;
}) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  let barColor = "bg-gradient-to-r from-accent to-accent2";
  if (percentage >= 90) barColor = "bg-gradient-to-r from-danger to-rose-400";
  else if (percentage >= 75) barColor = "bg-gradient-to-r from-warning to-amber-400";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">
          {used} <span className="text-muted">/</span> {limit}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-border/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
