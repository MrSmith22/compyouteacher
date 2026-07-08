import ProgressDots from "@/components/ui/ProgressDots";

export default function ModuleThreeProgress({
  steps,
  currentStepId,
  onStepChange,
}) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStepId)
  );
  const nextStep = steps[activeIndex + 1] || null;

  return (
    <div className="space-y-2 rounded-lg bg-surface-soft/50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-left">
        <p className="text-xs leading-relaxed text-text-muted">
          This is the same workspace. The question is just changing.
        </p>

        <div className="[&>div]:mb-0 [&_p]:text-[11px] [&_p]:font-normal [&_p]:text-text-muted/80">
          <ProgressDots
            total={steps.length}
            activeStep={activeIndex + 1}
            label={`${activeIndex + 1} of ${steps.length}`}
            onStepClick={(stepNum) => {
              const targetStep = steps[stepNum - 1];
              if (targetStep && stepNum - 1 <= activeIndex) {
                onStepChange?.(targetStep.id);
              }
            }}
          />
        </div>
      </div>

      {nextStep ? (
        <p className="text-left text-xs leading-relaxed text-text-muted">
          Still ahead: {nextStep.question}
        </p>
      ) : (
        <p className="text-left text-xs leading-relaxed text-text-muted">
          One more question, then you’ll have a clear main point.
        </p>
      )}

      <details>
        <summary className="cursor-pointer list-none text-xs text-text-muted transition-colors duration-150 hover:text-text-primary">
          See where you&apos;ve been
        </summary>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {steps.map((step, index) => {
            const isCurrent = step.id === currentStepId;
            const isVisited = index <= activeIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isVisited && onStepChange?.(step.id)}
                disabled={!isVisited}
                className={`rounded-md px-2 py-1.5 text-left text-xs leading-snug transition-colors duration-150 ${
                  isCurrent
                    ? "font-medium text-theme-blue"
                    : isVisited
                      ? "text-text-muted hover:text-text-primary"
                      : "cursor-not-allowed text-text-muted/50"
                }`}
              >
                {step.question}
                {step.optional ? (
                  <span className="ml-1 text-text-muted/70">(if you need it)</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}
