export default function ScoreBadge({ score }: { score: number }) {
  let color = "bg-danger/10 text-danger border-danger/20";
  let label = "Critical";

  if (score >= 80) {
    color = "bg-success/10 text-success border-success/20";
    label = "Good";
  } else if (score >= 60) {
    color = "bg-warning/10 text-warning border-warning/20";
    label = "Fair";
  } else if (score >= 40) {
    color = "bg-accent/10 text-accent border-accent/20";
    label = "Poor";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${color}`}>
      <span className="text-sm font-bold">{score}</span>
      {label}
    </span>
  );
}
