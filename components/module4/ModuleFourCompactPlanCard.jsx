"use client";

import Card from "@/components/ui/Card";

/**
 * Compact paragraph-plan summary for review map and success celebration.
 */
export default function ModuleFourCompactPlanCard({
  card,
  reviewed = false,
  active = false,
  onSelect = null,
  className = "",
}) {
  if (!card) return null;

  const interactive = typeof onSelect === "function";
  const Wrapper = interactive ? "button" : "div";
  const wrapperProps = interactive
    ? {
        type: "button",
        onClick: () => onSelect(card),
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={[
        "w-full text-left rounded-xl transition",
        interactive ? "focus:outline-none focus:ring-2 focus:ring-theme-blue/30" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Card
        padding="sm"
        elevation="soft"
        surface="soft"
        className={[
          "h-full border-2",
          reviewed
            ? "border-theme-green/40 bg-theme-green/[0.06]"
            : active
              ? "border-theme-blue/40 bg-theme-blue/[0.05]"
              : "border-border-soft/80 bg-white",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Body Paragraph {card.paragraphNumber}
          </p>
          {card.ready ? (
            <span className="rounded-full border border-theme-green/35 bg-theme-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-theme-green">
              Ready
            </span>
          ) : (
            <span className="rounded-full border border-theme-orange/35 bg-theme-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-theme-orange">
              Needs work
            </span>
          )}
          {reviewed ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-theme-green">
              Reviewed
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs font-semibold text-text-muted">Job</p>
        <p className="text-sm font-medium text-text-primary break-words">
          {card.jobLabel}
        </p>
        <p className="mt-2 text-xs font-semibold text-text-muted">Point</p>
        <p className="text-sm text-text-primary whitespace-pre-wrap break-words">
          {card.point || "—"}
        </p>
        <p className="mt-2 text-xs text-text-muted">
          Evidence:{" "}
          <span className="font-semibold text-text-primary">
            {card.evidenceCount === 1
              ? "1 quotation"
              : `${card.evidenceCount || 0} quotations`}
          </span>
        </p>
      </Card>
    </Wrapper>
  );
}
