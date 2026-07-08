export default function EmptyState({
  title,
  description,
  className = "",
}) {
  return (
    <div
      className={[
        "rounded-xl border border-dashed border-border-soft bg-surface px-4 py-5 text-left",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {title ? (
        <p className="text-sm font-semibold text-text-primary">{title}</p>
      ) : null}
      {description ? (
        <p className="mt-1 text-sm leading-relaxed text-text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
