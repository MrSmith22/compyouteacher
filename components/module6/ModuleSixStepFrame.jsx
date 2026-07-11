import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";

export const MODULE6_NEED_HELP_ID = "module-6-need-help";

const RESOURCE_CUE = {
  thesis: {
    label: "Thesis · Need Help",
    className:
      "inline-flex items-center rounded-md border border-theme-blue/30 bg-theme-blue/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-theme-blue",
  },
  outline: {
    label: "Outline · Need Help",
    className:
      "inline-flex items-center rounded-md border border-theme-green/30 bg-theme-green/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-theme-green",
  },
  help: {
    label: "Need Help below",
    className:
      "inline-flex items-center rounded-md border border-theme-orange/30 bg-theme-orange/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-theme-orange",
  },
};

function normalizeWhyMatters(whyMatters) {
  if (Array.isArray(whyMatters)) {
    return whyMatters.filter(Boolean);
  }

  if (typeof whyMatters === "string" && whyMatters.trim()) {
    return [whyMatters.trim()];
  }

  return [];
}

function normalizeExample(example) {
  if (!example) return null;
  if (typeof example === "string" && example.trim()) {
    return { sample: example.trim(), whyItWorks: "" };
  }
  if (typeof example === "object") {
    const sample = String(example.sample || example.text || "").trim();
    const whyItWorks = String(example.whyItWorks || example.annotation || "").trim();
    if (!sample) return null;
    return { sample, whyItWorks };
  }
  return null;
}

function normalizeJobSteps(steps) {
  if (!Array.isArray(steps)) return [];
  return steps
    .map((step) => {
      if (typeof step === "string" && step.trim()) {
        return { text: step.trim(), find: null };
      }
      if (step && typeof step === "object") {
        const text = String(step.text || "").trim();
        if (!text) return null;
        const find = RESOURCE_CUE[step.find] ? step.find : null;
        return { text, find };
      }
      return null;
    })
    .filter(Boolean);
}

function scrollToNeedHelp(event) {
  event.preventDefault();
  const el = document.getElementById(MODULE6_NEED_HELP_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  // Open the first collapsed tip if present so the jump feels useful.
  const firstDetails = el.querySelector("details");
  if (firstDetails && !firstDetails.open) {
    firstDetails.open = true;
  }
}

function NeedHelpJumpLink() {
  return (
    <a
      href={`#${MODULE6_NEED_HELP_ID}`}
      onClick={scrollToNeedHelp}
      className="inline-flex items-center gap-2 rounded-lg border-2 border-theme-orange/40 bg-theme-orange/10 px-3.5 py-2 text-sm font-semibold text-theme-orange shadow-soft transition hover:bg-theme-orange/15 focus:outline-none focus:ring-2 focus:ring-theme-orange/30"
    >
      Need Help
      <span className="text-xs font-medium text-theme-orange/80">↓ thesis, outline & tips</span>
    </a>
  );
}

function JobRightNowCard({ jobRightNow }) {
  const steps = normalizeJobSteps(jobRightNow?.steps);
  if (!steps.length) return null;

  return (
    <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
        Your job right now
      </p>
      {jobRightNow.lead ? (
        <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
          {jobRightNow.lead}
        </p>
      ) : null}
      <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-text-primary md:text-base">
        {steps.map((step) => {
          const cue = step.find ? RESOURCE_CUE[step.find] : null;
          return (
            <li key={step.text}>
              <span>{step.text}</span>
              {cue ? (
                <>
                  {" "}
                  <span className={cue.className}>{cue.label}</span>
                </>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-sm font-medium leading-relaxed text-text-primary">
        {jobRightNow.closing || "Start with Step 1 in the writing box below."}
      </p>
      {jobRightNow.findHint ? (
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          {jobRightNow.findHint}{" "}
          <a
            href={`#${MODULE6_NEED_HELP_ID}`}
            onClick={scrollToNeedHelp}
            className="font-semibold text-theme-orange underline decoration-theme-orange/40 underline-offset-2 hover:decoration-theme-orange"
          >
            Jump to Need Help
          </a>
        </p>
      ) : null}
    </div>
  );
}

function SupportingDetails({ whyLines, exampleBlock, successItems }) {
  return (
    <div className="max-w-2xl space-y-2 text-left">
      <details className="rounded-lg border border-border-soft/60 bg-surface-soft/40 px-4 py-2.5">
        <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
          Why this matters
        </summary>
        <div className="mt-2 space-y-2">
          {whyLines.length > 0 ? (
            whyLines.map((line) => (
              <p key={line} className="text-sm leading-relaxed text-text-muted">
                {line}
              </p>
            ))
          ) : (
            <p className="text-sm leading-relaxed text-text-muted">
              Keep going in your own words. We&apos;re building thinking you can use later.
            </p>
          )}
        </div>
      </details>

      <details className="rounded-lg border border-border-soft/60 bg-surface-soft/40 px-4 py-2.5">
        <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
          An example (and why it works)
        </summary>
        <div className="mt-2 space-y-2">
          {exampleBlock ? (
            <>
              <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
                {exampleBlock.sample}
              </p>
              {exampleBlock.whyItWorks ? (
                <p className="text-sm leading-relaxed text-text-muted">
                  <span className="font-medium text-text-primary">Why this works: </span>
                  {exampleBlock.whyItWorks}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm leading-relaxed text-text-muted">
              If you&apos;re not sure yet, start with a simple answer you can test.
            </p>
          )}
        </div>
      </details>

      <details className="rounded-lg border border-border-soft/60 bg-surface-soft/40 px-4 py-2.5">
        <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
          Self-check before you continue
        </summary>
        <div className="mt-2">
          {successItems.length > 0 ? (
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted marker:text-text-muted/60">
              {successItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed text-text-muted">
              If your thinking is clear enough to explain, it&apos;s clear enough to keep going.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}

/**
 * Shared drafting/revision frame.
 * When `jobRightNow` is provided (Module 6), hierarchy is:
 * Question → Your job right now → children (write) → Need Help.
 * Modules 7–8 omit jobRightNow and keep supporting details before children.
 */
export default function ModuleSixStepFrame({
  question,
  whyMatters,
  example = "",
  successLooksLike = [],
  children,
  sidebar = null,
  coachingMessage = "",
  nextStepText = "",
  jobRightNow = null,
  supportingResources = null,
}) {
  const whyLines = normalizeWhyMatters(whyMatters);
  const exampleBlock = normalizeExample(example);
  const successItems = Array.isArray(successLooksLike)
    ? successLooksLike.filter(Boolean)
    : [];
  const actionFirst = !!jobRightNow?.steps?.length;

  const supporting = (
    <SupportingDetails
      whyLines={whyLines}
      exampleBlock={exampleBlock}
      successItems={successItems}
    />
  );

  return (
    <WorkspaceColumns variant="drafting" className="gap-5 xl:gap-8">
      <WorkspaceSidebar className="opacity-80 lg:col-span-1">
        {sidebar}
      </WorkspaceSidebar>

      <WorkspaceCenter className="min-w-0">
        <div className="space-y-6 md:space-y-8">
          <header className="space-y-3 py-1 text-left md:py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Start here
            </p>
            <h1 className="max-w-4xl text-[1.85rem] font-bold leading-[1.1] tracking-tight text-text-primary md:text-[2.5rem] md:leading-[1.08]">
              {question}
            </h1>
            {actionFirst ? (
              <div className="pt-1">
                <NeedHelpJumpLink />
              </div>
            ) : null}
          </header>

          {actionFirst ? <JobRightNowCard jobRightNow={jobRightNow} /> : null}

          {!actionFirst ? supporting : null}

          <div className="space-y-6 md:space-y-7">{children}</div>

          {actionFirst ? (
            <section
              id={MODULE6_NEED_HELP_ID}
              className="scroll-mt-24 space-y-5 rounded-xl border-2 border-theme-orange/25 bg-theme-orange/[0.04] px-4 py-5 md:px-5"
              aria-labelledby="module-6-need-help-heading"
            >
              <div className="space-y-1 text-left">
                <p
                  id="module-6-need-help-heading"
                  className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange"
                >
                  Need Help
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  Your thesis, outline notes, and writing tips are here. Use them
                  whenever you get stuck—then keep writing above.
                </p>
              </div>
              {supportingResources}
              {supporting}
            </section>
          ) : null}
        </div>
      </WorkspaceCenter>

      <WorkspaceGuide className="opacity-90">
        <aside className="space-y-5 rounded-xl bg-surface-soft/70 px-5 py-5 text-left">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              From your teacher
            </p>
            <p className="text-sm leading-relaxed text-text-primary">
              {coachingMessage ||
                "Keep your language simple and honest. Clear thinking beats fancy words."}
            </p>
          </div>

          <div className="space-y-2 border-t border-border-soft/60 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              What comes next
            </p>
            <p className="text-sm leading-relaxed text-text-muted">
              {nextStepText ||
                "We'll keep following the same group of quotes as your thinking gets clearer."}
            </p>
          </div>
        </aside>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
