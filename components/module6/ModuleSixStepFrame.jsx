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

export default function ModuleSixStepFrame({
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
  const successItems = Array.isArray(successLooksLike)
    ? successLooksLike.filter(Boolean)
    : [];

  return (
    <WorkspaceColumns variant="drafting" className="gap-5 xl:gap-8">
      <WorkspaceSidebar className="opacity-80 lg:col-span-1">
        {sidebar}
      </WorkspaceSidebar>

      <WorkspaceCenter className="min-w-0">
        <div className="space-y-6 md:space-y-8">
          <header className="space-y-3 py-1 text-left md:py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Question
            </p>
            <h1 className="max-w-4xl text-[1.85rem] font-bold leading-[1.1] tracking-tight text-text-primary md:text-[2.5rem] md:leading-[1.08]">
              {question}
            </h1>
          </header>

          <div className="max-w-2xl space-y-2 text-left">
            <details className="rounded-lg bg-surface-soft/40 px-4 py-2.5">
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

            <details className="rounded-lg bg-surface-soft/40 px-4 py-2.5">
              <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                An example
              </summary>
              <div className="mt-2">
                {example ? (
                  <p className="text-sm leading-relaxed text-text-primary">{example}</p>
                ) : (
                  <p className="text-sm leading-relaxed text-text-muted">
                    If you&apos;re not sure yet, start with a simple answer you can test.
                  </p>
                )}
              </div>
            </details>

            <details className="rounded-lg bg-surface-soft/40 px-4 py-2.5">
              <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                Reflection: how do I know I&apos;m finished?
              </summary>
              <div className="mt-2">
                {successItems.length > 0 ? (
                  <>
                    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted marker:text-text-muted/60">
                      {successItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">
                      If your thinking is clear enough to explain, it&apos;s clear enough to keep going.
                    </p>
                  </>
                ) : (
                  <p className="text-sm leading-relaxed text-text-muted">
                    If your thinking is clear enough to explain, it&apos;s clear enough to keep going.
                  </p>
                )}
              </div>
            </details>
          </div>

          <div className="space-y-6 md:space-y-7">{children}</div>
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
              Where this is going
            </p>
            <p className="text-sm leading-relaxed text-text-muted">
              {nextStepText ||
                "We&apos;ll keep following the same group of quotes as your thinking gets clearer."}
            </p>
          </div>
        </aside>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
