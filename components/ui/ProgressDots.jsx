export default function ProgressDots({
  total,
  activeStep,
  label,
  onStepClick,
  isStepLocked,
  lockedHint,
}) {
  return (
    <div className="mb-4">
      {label && (
        <p className="mb-2 text-sm font-medium text-theme-blue">{label}</p>
      )}
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < activeStep;
          const isCurrent = stepNum === activeStep;
          const isLocked = isStepLocked?.(stepNum) === true;
          const isClickable = isLocked || stepNum <= activeStep;

          let dotClass =
            "w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ";
          if (isCompleted) {
            dotClass += "bg-theme-green";
          } else if (isCurrent) {
            dotClass += "bg-theme-blue ring-2 ring-theme-blue/30 ring-offset-1";
          } else if (isLocked) {
            dotClass += "bg-white border-2 border-dashed border-text-muted/50";
          } else {
            dotClass += "bg-surface-soft border border-border-soft";
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => isClickable && onStepClick?.(stepNum)}
              disabled={!isClickable}
              className={
                isClickable
                  ? "cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-theme-blue/20"
                  : "cursor-default rounded-full"
              }
              aria-label={`Step ${stepNum}${
                isCurrent ? " (current)" : isLocked ? " (locked)" : ""
              }`}
              aria-disabled={isLocked ? "true" : undefined}
              title={isLocked ? lockedHint || undefined : undefined}
            >
              <span className={dotClass} />
            </button>
          );
        })}
      </div>
      {lockedHint ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-2 text-xs leading-relaxed text-text-muted"
        >
          {lockedHint}
        </p>
      ) : null}
    </div>
  );
}
