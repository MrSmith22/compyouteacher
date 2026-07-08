export default function WorkspaceHeader({
  eyebrow,
  title,
  description,
  className = "",
}) {
  return (
    <div className={["space-y-3 text-left", className].filter(Boolean).join(" ")}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-theme-blue">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-theme-blue">{title}</h1>
        {description ? (
          <p className="text-sm leading-relaxed text-text-muted">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
