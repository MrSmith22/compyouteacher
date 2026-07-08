const TONE_CLASSES = {
  info: "border-theme-blue/15 bg-theme-blue/5",
  success: "border-theme-green/15 bg-theme-green/5",
  warning: "border-theme-orange/15 bg-theme-orange/5",
  danger: "border-theme-red/15 bg-theme-red/5",
  neutral: "border-border-soft bg-surface-soft",
};

export default function InfoCallout({
  title,
  children,
  tone = "info",
  className = "",
}) {
  return (
    <div
      className={[
        "rounded-xl border px-4 py-3 text-left",
        TONE_CLASSES[tone] || TONE_CLASSES.info,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {title ? (
        <p className="text-sm font-semibold text-text-primary">{title}</p>
      ) : null}
      <div className={title ? "mt-2 text-sm leading-relaxed text-text-muted" : "text-sm leading-relaxed text-text-muted"}>
        {children}
      </div>
    </div>
  );
}
