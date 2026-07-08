import EmptyState from "@/components/ui/EmptyState";

export default function ModuleThreeThinkingCanvas({ canvasState }) {
  const { progressStory } = canvasState;
  const completed = progressStory?.completed ?? [];
  const next = progressStory?.next ?? "";

  return (
    <aside className="space-y-4 rounded-xl bg-surface-soft/60 px-4 py-4 text-left">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
        Notebook
      </p>

      {completed.length > 0 ? (
        <ul className="space-y-2">
          {completed.map((line) => (
            <li
              key={line}
              className="flex items-start gap-2 text-sm leading-relaxed text-text-muted"
            >
              <span aria-hidden="true" className="mt-0.5 text-text-muted/50">
                ·
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nothing written yet"
          description="As you answer each question, a short record of your thinking will appear here."
          className="border-0 bg-transparent p-0 shadow-none"
        />
      )}

      {next ? (
        <div className="border-t border-border-soft/60 pt-3">
          <p className="text-xs text-text-muted">Still on your mind</p>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">{next}</p>
        </div>
      ) : null}
    </aside>
  );
}
