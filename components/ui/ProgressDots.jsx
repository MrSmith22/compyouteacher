export default function ProgressDots({
  total,
  activeStep,
  label,
  onStepClick,
}) {
  return (
    <div className="mb-4">
      {label && (
        <p className="text-sm font-medium text-theme-blue mb-2">{label}</p>
      )}
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < activeStep;
          const isCurrent = stepNum === activeStep;
          const isClickable = stepNum <= activeStep;

          let dotClass =
            "w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ";
          if (isCompleted) {
            dotClass += "bg-theme-green";
          } else if (isCurrent) {
            dotClass += "bg-theme-blue ring-2 ring-theme-blue/30 ring-offset-1";
          } else {
            dotClass += "bg-theme-light border border-border-soft";
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => isClickable && onStepClick?.(stepNum)}
              disabled={!isClickable}
              className={isClickable ? "cursor-pointer" : "cursor-default"}
              aria-label={`Step ${stepNum}${isCurrent ? " (current)" : ""}`}
            >
              <span className={dotClass} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
