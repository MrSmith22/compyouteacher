import Card from "@/components/ui/Card";
import { romanNumeral } from "@/components/module6/module6StepPresentation";
import { MODULE8_STEP_TYPES } from "@/components/module8/module8StepPresentation";
import { HIERARCHY_REFERENCE_LINK_CLASS } from "@/lib/ui/hierarchyContract";

const APA_TEMPLATE_URL =
  "https://docs.google.com/document/d/14oSW0QNGaDbnmF3QL3UzFku2dJIgw3nGDV6K-HGvNtY/copy";

const APA_SAMPLE_URL =
  "https://apastyle.apa.org/style-grammar-guidelines/paper-format/student-annotated";

const PURDUE_APA_URL =
  "https://owl.purdue.edu/owl/research_and_citation/apa_style/apa_formatting_and_style_guide/general_format.html";

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

function DraftMapPreview({ step, sectionText = "" }) {
  const preview = String(sectionText || "")
    .trim()
    .split(/\s+/)
    .slice(0, 12)
    .join(" ");
  const label = `${romanNumeral(step.roman)}. ${step.title}`;

  return (
    <div className="rounded-lg border border-border-soft/70 bg-surface-soft/40 px-3 py-2 text-left">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      {preview ? (
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          {preview}
          {String(sectionText || "").trim().split(/\s+/).length > 12 ? "…" : ""}
        </p>
      ) : (
        <p className="mt-1 text-xs text-text-muted/80">No text yet.</p>
      )}
    </div>
  );
}

export default function ModuleEightReferenceShelf({
  assignmentQuestion = "",
  sectionSteps = [],
  sections = [],
  activeStepType = null,
  submissionDocUrl = null,
  checklistComplete = false,
}) {
  return (
    <aside className="space-y-3 text-left">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
          On the shelf
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-text-muted/80">
          Reference for preparing your paper—not rewriting your essay.
        </p>
      </div>

      <Card padding="sm" elevation="soft" surface="soft" className="space-y-3">
        <div className="space-y-2 border-b border-border-soft/60 pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Your path to turning in
          </p>
          <ol className="space-y-1.5 text-xs leading-relaxed text-text-muted">
            <li
              className={
                activeStepType === MODULE8_STEP_TYPES.CREATE_DOC
                  ? "font-medium text-theme-blue"
                  : ""
              }
            >
              Finished essay (Module 7)
            </li>
            <li
              className={
                activeStepType === MODULE8_STEP_TYPES.FORMAT ||
                (submissionDocUrl && activeStepType !== MODULE8_STEP_TYPES.CREATE_DOC)
                  ? "font-medium text-theme-blue"
                  : ""
              }
            >
              Submission document (Google Doc)
              {submissionDocUrl ? " ✓" : ""}
            </li>
            <li className="text-text-muted/80">
              Submitted PDF (Module 9)
            </li>
          </ol>
        </div>

        <CollapsibleShelfSection title="Assignment prompt" defaultOpen>
          {assignmentQuestion ? (
            <p className="text-sm leading-relaxed text-text-primary">{assignmentQuestion}</p>
          ) : (
            <p className="text-xs text-text-muted">Your assignment question will appear here.</p>
          )}
        </CollapsibleShelfSection>

        <div className="space-y-2 border-b border-border-soft/60 pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Finished essay map
          </p>
          <div className="space-y-2">
            {sectionSteps.map((step) => (
              <DraftMapPreview
                key={step.id}
                step={step}
                sectionText={sections[step.draftIndex] || ""}
              />
            ))}
          </div>
        </div>

        <CollapsibleShelfSection
          title="Google Docs template"
          defaultOpen={activeStepType === MODULE8_STEP_TYPES.CREATE_DOC}
        >
          <p className="mb-2 text-xs leading-relaxed text-text-muted">
            Optional APA template if you need a fresh starting document.
          </p>
          <a
            href={APA_TEMPLATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={HIERARCHY_REFERENCE_LINK_CLASS}
            data-testid="module8-apa-template-link"
          >
            Copy APA Google Docs template
          </a>
        </CollapsibleShelfSection>

        <CollapsibleShelfSection
          title="APA resources"
          defaultOpen={activeStepType === MODULE8_STEP_TYPES.FORMAT}
        >
          <ul className="space-y-2 text-xs text-text-muted">
            <li>
              <a
                href={APA_SAMPLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={HIERARCHY_REFERENCE_LINK_CLASS}
                data-testid="module8-apa-sample-link"
              >
                APA student paper example
              </a>
            </li>
            <li>
              <a
                href={PURDUE_APA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={HIERARCHY_REFERENCE_LINK_CLASS}
                data-testid="module8-apa-owl-link"
              >
                Purdue OWL APA guide
              </a>
            </li>
          </ul>
        </CollapsibleShelfSection>

        <CollapsibleShelfSection title="Submission expectations">
          <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-text-muted">
            <li>Module 9: short APA quiz</li>
            <li>Module 9: upload your final PDF</li>
            <li>
              Formatting checklist{" "}
              {checklistComplete ? (
                <span className="text-theme-green">complete ✓</span>
              ) : (
                "— complete in Step 2"
              )}
            </li>
          </ul>
        </CollapsibleShelfSection>
      </Card>
    </aside>
  );
}
