import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import Divider from "@/components/ui/Divider";
import SectionCard from "@/components/ui/SectionCard";

function normalizeWhyMatters(whyMatters) {
  if (Array.isArray(whyMatters)) {
    return whyMatters.filter(Boolean);
  }

  if (typeof whyMatters === "string" && whyMatters.trim()) {
    return [whyMatters.trim()];
  }

  return [];
}

export default function ModuleThreeStepFrame({
  stepNumber,
  totalSteps,
  question,
  whyMatters,
  primaryAction,
  example = "",
  successLooksLike = [],
  children,
  sidebar = null,
  coachingMessage = "",
  nextStepText = "",
}) {
  const whyLines = normalizeWhyMatters(whyMatters);

  return (
    <WorkspaceColumns>
      <WorkspaceSidebar>{sidebar}</WorkspaceSidebar>

      <WorkspaceCenter>
        <div className="space-y-5">
          <div className="space-y-3 text-left">
            <h1 className="text-3xl font-bold leading-tight text-text-primary">
              {question}
            </h1>
          </div>

          {whyLines.length > 0 ? (
            <div className="space-y-1 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-theme-blue">
                Why does this matter?
              </p>
              {whyLines.map((line) => (
                <p key={line} className="text-sm leading-relaxed text-text-muted">
                  {line}
                </p>
              ))}
            </div>
          ) : null}

          {example ? (
            <div className="rounded-xl border border-theme-orange/20 bg-theme-orange/5 px-4 py-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-theme-orange">
                Example
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text-primary">{example}</p>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-left">
              <p className="text-sm font-semibold text-text-primary">Let&apos;s do it.</p>
              {primaryAction ? (
                <span className="rounded-full border border-theme-blue/25 bg-theme-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-theme-blue">
                  {primaryAction}
                </span>
              ) : null}
            </div>

            <div className="rounded-2xl border border-theme-blue/15 bg-surface p-5 shadow-card md:p-6">
              {children}
            </div>
          </div>

          {successLooksLike.length > 0 ? (
            <SectionCard
              eyebrow="Success looks like..."
              padding="sm"
              surface="soft"
              elevation="soft"
            >
              <ul className="list-disc space-y-2 pl-5 text-left text-sm leading-relaxed text-text-muted marker:text-theme-blue">
                {successLooksLike.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </SectionCard>
          ) : null}
        </div>
      </WorkspaceCenter>

      <WorkspaceGuide>
        <SectionCard
          eyebrow="Your teacher"
          title="A quick reminder"
          padding="sm"
          surface="soft"
          elevation="soft"
          className="space-y-4"
        >
          {coachingMessage ? (
            <p className="text-left text-sm leading-relaxed text-text-primary">
              {coachingMessage}
            </p>
          ) : null}

          {nextStepText ? (
            <>
              {coachingMessage ? <Divider /> : null}
              <div className="space-y-1 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-theme-blue">
                  When you&apos;re ready
                </p>
                <p className="text-sm leading-relaxed text-text-muted">{nextStepText}</p>
              </div>
            </>
          ) : null}
        </SectionCard>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
