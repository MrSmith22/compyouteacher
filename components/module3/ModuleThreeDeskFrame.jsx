export function WorkingSetSection({
  label = "",
  description = "",
  children,
  className = "",
}) {
  return (
    <section
      className={["space-y-4", className].filter(Boolean).join(" ")}
    >
      <div className="text-left">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary">
          Working set
        </p>
        {label ? (
          <p className="mt-1.5 text-sm font-medium text-text-primary">{label}</p>
        ) : null}
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      <div className="rounded-xl border-2 border-theme-dark/12 bg-white p-4 shadow-soft ring-1 ring-theme-dark/[0.03] md:p-5">
        {children}
      </div>
    </section>
  );
}

export function ReferenceSection({
  label = "",
  description = "",
  children,
  className = "",
}) {
  return (
    <section
      className={["space-y-3", className].filter(Boolean).join(" ")}
    >
      <div className="text-left">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Reference
        </p>
        {label ? (
          <p className="mt-1 text-xs text-text-muted">{label}</p>
        ) : null}
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-text-muted/80">
            {description}
          </p>
        ) : null}
      </div>
      <div className="rounded-lg bg-surface-soft/40 px-3 py-4 md:px-4">
        {children}
      </div>
    </section>
  );
}
