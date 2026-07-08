export default function PageHeader({
  eyebrow,
  title,
  description,
  meta = null,
  className = "",
}) {
  return (
    <div className={["space-y-2 text-left", className].filter(Boolean).join(" ")}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-theme-blue">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-extrabold text-theme-blue">{title}</h1>
      {description ? (
        <p className="max-w-3xl text-sm leading-relaxed text-text-muted">
          {description}
        </p>
      ) : null}
      {meta ? <div>{meta}</div> : null}
    </div>
  );
}
