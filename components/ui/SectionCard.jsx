import Card from "@/components/ui/Card";

export default function SectionCard({
  eyebrow,
  title,
  description,
  actions = null,
  children,
  className = "",
  contentClassName = "",
  padding = "sm",
  surface = "default",
  elevation = "card",
}) {
  const hasHeader = eyebrow || title || description || actions;

  return (
    <Card
      padding={padding}
      surface={surface}
      elevation={elevation}
      className={className}
    >
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 text-left">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-theme-blue">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm leading-relaxed text-text-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      )}

      <div
        className={[
          hasHeader ? "mt-4" : "",
          "space-y-4",
          contentClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </Card>
  );
}
