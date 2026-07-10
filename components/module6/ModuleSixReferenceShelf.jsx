import Card from "@/components/ui/Card";
import ArtifactChip from "@/components/ui/ArtifactChip";
import { romanNumeral } from "@/components/module6/module6StepPresentation";

function ShelfSection({ title, artifactType = null, children, emptyText = "Not yet." }) {
  return (
    <div className="space-y-2 border-b border-border-soft/60 pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-2">
        {artifactType ? (
          <ArtifactChip artifactType={artifactType} label={title} />
        ) : (
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {title}
          </p>
        )}
      </div>
      <div className="text-sm leading-relaxed text-text-primary">
        {children ?? (
          <p className="text-xs leading-relaxed text-text-muted">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function CollapsibleShelfSection({
  title,
  children,
  emptyText = "Not yet.",
  defaultOpen = false,
}) {
  return (
    <details
      className="rounded-lg border border-border-soft/50 bg-surface-soft/30 px-3 py-2"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
        {title}
      </summary>
      <div className="mt-2 text-sm leading-relaxed text-text-primary">
        {children ?? (
          <p className="text-xs leading-relaxed text-text-muted">{emptyText}</p>
        )}
      </div>
    </details>
  );
}

function OutlineSectionPreview({ label, points = [], isActive = false }) {
  return (
    <div
      className={[
        "rounded-lg border px-3 py-2 text-left",
        isActive
          ? "border-theme-blue/30 bg-theme-blue/5"
          : "border-border-soft/70 bg-surface-soft/40",
      ].join(" ")}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
        {isActive ? " · drafting now" : ""}
      </p>
      {points.length > 0 ? (
        <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs text-text-muted">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ParagraphPlanPreview({ index, plan, isActive }) {
  const claim = (plan?.claim || "").trim();
  const snippets = Array.isArray(plan?.evidenceSnippets) ? plan.evidenceSnippets : [];

  return (
    <div
      className={[
        "rounded-lg border px-3 py-2 text-left",
        isActive
          ? "border-theme-blue/30 bg-theme-blue/5"
          : "border-border-soft/70 bg-surface-soft/40",
      ].join(" ")}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        Paragraph plan {index + 1}
        {isActive ? " · drafting now" : ""}
      </p>
      {claim ? (
        <p className="mt-1 text-sm text-text-primary whitespace-pre-wrap">{claim}</p>
      ) : null}
      {snippets.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-text-muted">
          {snippets.slice(0, 3).map((snippet, snippetIndex) => {
            const quote = String(snippet?.quote || "").trim();
            const observation = String(snippet?.observation || "").trim();
            const line = [observation, quote ? `"${quote}"` : ""].filter(Boolean).join(" — ");
            return line ? <li key={`${index}-${snippetIndex}`}>{line}</li> : null;
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function ModuleSixReferenceShelf({
  assignmentQuestion = "",
  thesis = "",
  proofPlan = [],
  outline = null,
  paragraphPlans = [],
  observations = [],
  activeStep = null,
}) {
  const body = Array.isArray(outline?.body) ? outline.body : [];
  const activeBodyIndex =
    activeStep?.type === "body" ? activeStep.bodyIndex : -1;

  return (
    <aside className="space-y-3 text-left">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
          On the shelf
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-text-muted/80">
          Your thesis and the outline section marked “drafting now” are your guides.
          Open the rest when you need a reminder.
        </p>
      </div>

      <Card padding="sm" elevation="soft" surface="soft" className="space-y-3">
        <ShelfSection
          title="Your thesis (already written)"
          artifactType="thesis"
          emptyText="Your thesis will appear here."
        >
          {thesis ? (
            <p className="whitespace-pre-wrap text-sm font-medium text-text-primary">
              {thesis}
            </p>
          ) : null}
        </ShelfSection>

        <ShelfSection title="Outline" artifactType="outline" emptyText="Your outline will appear here.">
          <div className="space-y-2">
            <OutlineSectionPreview
              label={`${romanNumeral(0)}. Introduction`}
              isActive={activeStep?.type === "intro"}
            />
            {body.map((card, index) => (
              <OutlineSectionPreview
                key={`outline-${index}`}
                label={`${romanNumeral(index + 1)}. ${card.bucket || "Body paragraph"}`}
                points={Array.isArray(card.points) ? card.points : []}
                isActive={index === activeBodyIndex}
              />
            ))}
            <OutlineSectionPreview
              label={`${romanNumeral(body.length + 1)}. Conclusion`}
              isActive={activeStep?.type === "conclusion"}
            />
          </div>
        </ShelfSection>

        <CollapsibleShelfSection
          title="Assignment question"
          emptyText="Your assignment question will appear here."
        >
          {assignmentQuestion ? (
            <p className="text-sm leading-relaxed text-text-primary">{assignmentQuestion}</p>
          ) : null}
        </CollapsibleShelfSection>

        <CollapsibleShelfSection
          title="Proof plan"
          emptyText="Proof directions from Module 3 will appear here when you have them."
        >
          {proofPlan.length > 0 ? (
            <ol className="list-decimal list-inside space-y-1 text-sm text-text-primary">
              {proofPlan.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          ) : null}
        </CollapsibleShelfSection>

        {paragraphPlans.length > 0 ? (
          <CollapsibleShelfSection
            title="Paragraph plans"
            emptyText="Paragraph plans from Module 4 will appear here."
          >
            <div className="space-y-2">
              {paragraphPlans.map((plan, index) => (
                <ParagraphPlanPreview
                  key={`plan-${index}`}
                  index={index}
                  plan={plan}
                  isActive={index === activeBodyIndex}
                />
              ))}
            </div>
          </CollapsibleShelfSection>
        ) : null}

        <CollapsibleShelfSection
          title="Evidence"
          emptyText="Your evidence notes will appear here."
        >
          {observations.length > 0 ? (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-text-muted">
              {observations.map((entry) => (
                <li key={entry.id} className="border-b border-border-soft/50 pb-1">
                  <span className="font-medium text-text-primary">
                    {String(entry.category || "").toUpperCase()}
                  </span>
                  {` — `}
                  {entry.observation || entry.speech_note || entry.letter_note}
                </li>
              ))}
            </ul>
          ) : null}
        </CollapsibleShelfSection>
      </Card>
    </aside>
  );
}
