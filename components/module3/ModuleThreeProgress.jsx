import SectionCard from "@/components/ui/SectionCard";
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
    <SectionCard
      padding="sm"
      surface="soft"
      elevation="soft"
      className="space-y-2 border-border-soft/80"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-left">
        <p className="text-xs text-text-muted">
          {activeIndex === 0
            ? "A few questions to guide your thinking — take your time."
            : `You have already answered ${activeIndex} question${
                activeIndex === 1 ? "" : "s"
              }. Keep going.`}
        </p>

        <div className="[&_p]:text-xs [&_p]:font-normal [&_p]:text-text-muted">
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
        <p className="text-left text-xs text-text-muted">
          Up next: <span className="text-text-primary">{nextStep.question}</span>
        </p>
      ) : (
        <p className="text-left text-xs text-text-muted">
          This is the last big question — you are almost ready to write.
        </p>
      )}

      <details className="rounded-lg border border-border-soft bg-surface">
        <summary className="cursor-pointer list-none px-4 py-2 text-xs font-medium text-theme-blue transition-colors duration-150 hover:bg-theme-blue/5">
          See where you&apos;ve been
        </summary>
        <div className="grid gap-1 border-t border-border-soft px-3 py-2 sm:grid-cols-2">
          {steps.map((step, index) => {
            const isCurrent = step.id === currentStepId;
            const isVisited = index <= activeIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isVisited && onStepChange?.(step.id)}
                disabled={!isVisited}
                className={`rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 ${
                  isCurrent
                    ? "bg-theme-blue/10 font-semibold text-theme-blue"
                    : isVisited
                      ? "text-text-primary hover:bg-surface-soft"
                      : "cursor-not-allowed text-text-muted"
                }`}
              >
                {step.question}
                {step.optional ? (
                  <span className="ml-1 text-xs text-text-muted">(if you need it)</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </details>
    </SectionCard>
  );
}
