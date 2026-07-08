import Divider from "@/components/ui/Divider";
import EmptyState from "@/components/ui/EmptyState";
import SectionCard from "@/components/ui/SectionCard";

export default function ModuleThreeThinkingCanvas({ canvasState }) {
  const { progressStory } = canvasState;
  const completed = progressStory?.completed ?? [];
  const next = progressStory?.next ?? "";

  return (
    <div className="space-y-4">
      <SectionCard
        eyebrow="My notebook"
        title="Your thinking so far"
        surface="soft"
        elevation="soft"
        padding="sm"
      >
        {completed.length > 0 ? (
          <ul className="space-y-2 text-left">
            {completed.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 text-sm leading-relaxed text-text-primary"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 text-theme-green"
                >
                  ✓
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nothing here yet"
            description="As you answer each question, this notebook shows what you have figured out so far."
          />
        )}

        {next ? (
          <>
            <Divider />
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-theme-blue">
                Still wondering
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">{next}</p>
            </div>
          </>
        ) : null}
      </SectionCard>
    </div>
  );
}
