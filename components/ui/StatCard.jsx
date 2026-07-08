import Card from "@/components/ui/Card";

export default function StatCard({
  label,
  value,
  helper,
  className = "",
  valueClassName = "",
}) {
  return (
    <Card padding="sm" surface="soft" elevation="soft" className={className}>
      <p className="text-sm font-semibold text-text-primary">{label}</p>
      <p
        className={[
          "mt-1 text-2xl font-extrabold text-theme-blue",
          valueClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </p>
      {helper ? (
        <p className="mt-1 text-xs text-text-muted">{helper}</p>
      ) : null}
    </Card>
  );
}
