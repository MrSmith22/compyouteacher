import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";

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
  question,
  whyMatters,
  example = "",
  successLooksLike = [],
  children,
  sidebar = null,
  coachingMessage = "",
  nextStepText = "",
}) {
  const whyLines = normalizeWhyMatters(whyMatters);

  return (
    <WorkspaceColumns className="gap-6 xl:gap-10">
      <WorkspaceSidebar className="opacity-90">{sidebar}</WorkspaceSidebar>

      <WorkspaceCenter>
        <div className="space-y-8 md:space-y-10">
          <header className="space-y-4 py-2 text-left md:py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Question
            </p>
            <h1 className="max-w-3xl text-[1.75rem] font-bold leading-[1.12] tracking-tight text-text-primary md:text-[2.35rem] md:leading-[1.1]">
              {question}
            </h1>

            {whyLines.length > 0 ? (
              <div className="max-w-2xl space-y-2 pt-1">
                <p className="text-xs font-medium text-text-muted">Why this matters</p>
                {whyLines.map((line) => (
                  <p key={line} className="text-sm leading-relaxed text-text-muted">
                    {line}
                  </p>
                ))}
              </div>
            ) : null}
          </header>

          {example ? (
            <div className="max-w-2xl rounded-lg bg-theme-orange/[0.06] px-4 py-3 text-left">
              <p className="text-xs text-text-muted">For example</p>
              <p className="mt-1 text-sm leading-relaxed text-text-primary">{example}</p>
            </div>
          ) : null}

          <div className="space-y-8">
            {children}
          </div>

          {successLooksLike.length > 0 ? (
            <div className="max-w-2xl space-y-2 text-left">
              <p className="text-xs text-text-muted">You&apos;ll know you&apos;re ready when…</p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted marker:text-text-muted/60">
                {successLooksLike.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </WorkspaceCenter>

      <WorkspaceGuide className="opacity-90">
        <aside className="space-y-5 rounded-xl bg-surface-soft/70 px-4 py-5 text-left">
          {coachingMessage ? (
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                From your teacher
              </p>
              <p className="text-sm leading-relaxed text-text-primary">{coachingMessage}</p>
            </div>
          ) : null}

          {nextStepText ? (
            <div className="space-y-2 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                After this
              </p>
              <p className="text-sm leading-relaxed text-text-muted">{nextStepText}</p>
            </div>
          ) : null}
        </aside>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
