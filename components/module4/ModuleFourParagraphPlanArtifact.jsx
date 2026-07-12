"use client";

/**
 * Readable Module 4 paragraph-plan artifact.
 * Presentation only — edit buttons navigate to existing flow steps.
 */

function EditLink({ label, onClick }) {
  return (
    <button
      type="button"
      className="mt-2 inline-flex min-h-[44px] items-center rounded-lg border border-theme-blue/35 bg-white px-3 py-1.5 text-xs font-semibold text-theme-blue hover:bg-theme-blue/5 focus:outline-none focus:ring-2 focus:ring-theme-blue/30"
      onClick={onClick}
      aria-label={label}
    >
      {label}
    </button>
  );
}

function EvidenceItemCard({ item, compact = false }) {
  if (!item) return null;
  const quote = compact ? item.quotePreview || item.quote : item.quote;
  if (!quote && !item.appeal && !item.sourceLabel) return null;

  return (
    <div className="rounded-lg border border-theme-blue/20 bg-theme-light/90 p-3 space-y-2 text-sm text-left">
      {item.compatibilityLabel ? (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-dark/55">
          {item.compatibilityLabel}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-theme-dark">
        {item.sourceLabel ? (
          <span className="rounded border border-theme-dark/15 bg-white/90 px-2 py-1">
            {item.sourceLabel}
          </span>
        ) : null}
        {item.appeal ? (
          <span className="rounded border border-theme-dark/15 bg-white/90 px-2 py-1 capitalize">
            {item.appeal}
          </span>
        ) : null}
      </div>
      {quote ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-theme-dark/55 mb-0.5">
            Quotation
          </p>
          <p className="italic text-theme-dark/90 break-words">&ldquo;{quote}&rdquo;</p>
        </div>
      ) : null}
      {!compact && item.module2Note ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-theme-dark/55 mb-0.5">
            Module 2 note
          </p>
          <p className="text-theme-dark/90 leading-relaxed break-words">
            {item.module2Note}
          </p>
        </div>
      ) : null}
      {!compact && item.module3Note ? (
        <div className="rounded-md border border-theme-orange/25 bg-theme-orange/5 p-2.5">
          <p className="text-xs font-bold uppercase tracking-wide text-theme-orange mb-1">
            Module 3 connection
          </p>
          {item.module3RelationLabel ? (
            <p className="text-xs font-semibold text-theme-dark mb-1">
              {item.module3RelationLabel}
            </p>
          ) : null}
          <p className="text-sm text-theme-dark/90 leading-relaxed break-words">
            {item.module3Note}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function ModuleFourParagraphPlanArtifact({
  artifact,
  showReadyBanner = false,
  showEditActions = false,
  compactEvidence = false,
  showThesisConnection = true,
  onEditPart = null,
  className = "",
}) {
  if (!artifact) return null;

  const handleEdit = (part) => {
    if (typeof onEditPart !== "function") return;
    const step = artifact.editTargets?.[part];
    if (typeof step === "number") onEditPart(part, step);
  };

  return (
    <article
      className={[
        "rounded-xl border text-left",
        showReadyBanner
          ? "border-theme-green/40 bg-theme-green/[0.06]"
          : "border-border-soft/80 bg-white",
        "p-4 sm:p-5 space-y-5",
        className,
      ].join(" ")}
      aria-label={artifact.title}
    >
      {showReadyBanner && artifact.ready ? (
        <p className="text-sm font-extrabold text-theme-green" role="status">
          {artifact.readyHeading}
        </p>
      ) : null}

      <header>
        <h3 className="text-lg font-extrabold text-theme-dark sm:text-xl">
          {artifact.title}
        </h3>
      </header>

      <section aria-labelledby={`plan-${artifact.paragraphNumber}-job`}>
        <h4
          id={`plan-${artifact.paragraphNumber}-job`}
          className="text-xs font-bold uppercase tracking-wide text-theme-dark/55"
        >
          Job
        </h4>
        <p className="mt-1 text-base font-medium text-theme-dark break-words">
          {artifact.job?.label}
        </p>
        {showEditActions ? (
          <EditLink label="Edit job" onClick={() => handleEdit("job")} />
        ) : null}
      </section>

      <section aria-labelledby={`plan-${artifact.paragraphNumber}-point`}>
        <h4
          id={`plan-${artifact.paragraphNumber}-point`}
          className="text-xs font-bold uppercase tracking-wide text-theme-dark/55"
        >
          Point
        </h4>
        {artifact.point?.builtFromLabel ? (
          <p className="mt-1 text-[11px] text-theme-dark/55">
            {artifact.point.builtFromLabel}
          </p>
        ) : null}
        <p className="mt-1 text-base text-theme-dark whitespace-pre-wrap break-words">
          {artifact.point?.text || "—"}
        </p>
        {showEditActions ? (
          <EditLink label="Edit point" onClick={() => handleEdit("point")} />
        ) : null}
      </section>

      <section aria-labelledby={`plan-${artifact.paragraphNumber}-evidence`}>
        <h4
          id={`plan-${artifact.paragraphNumber}-evidence`}
          className="text-xs font-bold uppercase tracking-wide text-theme-dark/55 mb-2"
        >
          Evidence
          {typeof artifact.evidence?.count === "number"
            ? ` (${artifact.evidence.count})`
            : ""}
        </h4>
        {(artifact.evidence?.items || []).length === 0 ? (
          <p className="text-sm text-theme-dark/70">No qualifying evidence yet.</p>
        ) : (
          <div className="space-y-2">
            {artifact.evidence.items.map((item, index) => (
              <EvidenceItemCard
                key={`${item.savedKey || "ev"}-${index}`}
                item={item}
                compact={compactEvidence}
              />
            ))}
          </div>
        )}
        {showEditActions ? (
          <EditLink label="Edit evidence" onClick={() => handleEdit("evidence")} />
        ) : null}
      </section>

      <section aria-labelledby={`plan-${artifact.paragraphNumber}-reasoning`}>
        <h4
          id={`plan-${artifact.paragraphNumber}-reasoning`}
          className="text-xs font-bold uppercase tracking-wide text-theme-dark/55"
        >
          Reasoning
        </h4>
        <p className="mt-1 text-xs font-semibold text-theme-dark/70">
          {artifact.reasoning?.label}
        </p>
        <p className="mt-1 text-base text-theme-dark whitespace-pre-wrap break-words">
          {artifact.reasoning?.text || "—"}
        </p>
        {showEditActions ? (
          <EditLink
            label="Edit reasoning"
            onClick={() => handleEdit("reasoning")}
          />
        ) : null}
      </section>

      {showThesisConnection && artifact.thesisConnection?.text ? (
        <section aria-labelledby={`plan-${artifact.paragraphNumber}-thesis`}>
          <h4
            id={`plan-${artifact.paragraphNumber}-thesis`}
            className="text-xs font-bold uppercase tracking-wide text-theme-dark/55"
          >
            Connection to the thesis
          </h4>
          <p className="mt-1 text-xs font-semibold text-theme-dark/70">
            {artifact.thesisConnection.label}
          </p>
          <p className="mt-1 text-sm text-theme-dark/85 whitespace-pre-wrap break-words">
            {artifact.thesisConnection.text}
          </p>
        </section>
      ) : null}
    </article>
  );
}
