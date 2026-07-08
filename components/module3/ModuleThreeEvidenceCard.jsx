import ArtifactChip from "@/components/ui/ArtifactChip";
import Card from "@/components/ui/Card";

const MARKER_LABELS = {
  important: "Important",
  surprising: "Surprising",
  repeated: "Repeated",
};

function MetaTag({ children, tone = "default" }) {
  const toneClassName =
    tone === "marker"
      ? "border-theme-orange/15 bg-theme-orange/10 text-theme-orange"
      : "border-border-soft bg-surface-soft text-text-primary";

  return (
    <span
      className={[
        "rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClassName,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function observationPreview(text = "") {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }

  const sentenceMatch = trimmed.match(/^.*?[.!?](?:\s|$)/);
  const firstSentence = sentenceMatch ? sentenceMatch[0].trim() : trimmed;

  if (firstSentence.length <= 160) {
    return firstSentence;
  }

  return `${firstSentence.slice(0, 157).trimEnd()}...`;
}

export default function ModuleThreeEvidenceCard({
  evidence,
  selected = false,
  onToggleSelected,
  marker = "",
  onMarkerChange,
  children = null,
  compact = false,
  showArtifactLabel = true,
}) {
  const observationLine = observationPreview(evidence.observation);
  const hasExpandedDetails =
    Boolean(onMarkerChange) ||
    evidence.tags.length > 0 ||
    Boolean(!compact && evidence.audienceEffect) ||
    Boolean(!compact && evidence.purposeConnection) ||
    Boolean(!compact && evidence.essentialQuestionConnection) ||
    (Boolean(evidence.observation) && observationLine !== evidence.observation.trim());

  return (
    <Card
      padding="sm"
      className={`${
        selected
          ? "border-theme-green/30 bg-theme-green/[0.04] ring-1 ring-theme-green/15 transition-all duration-150"
          : "border-border-soft/80 transition-all duration-150 hover:border-theme-blue/15"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 text-left">
          {showArtifactLabel ? (
            <div className="flex flex-wrap items-center gap-2">
              <ArtifactChip artifactType="evidence" />
              {marker ? (
                <MetaTag tone="marker">{MARKER_LABELS[marker]}</MetaTag>
              ) : null}
            </div>
          ) : marker ? (
            <MetaTag tone="marker">{MARKER_LABELS[marker]}</MetaTag>
          ) : null}
          <p className="text-sm font-semibold text-text-primary">
            {evidence.sourceLabel} · {evidence.sourceTitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onToggleSelected ? (
            <label
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors duration-150 ${
                selected
                  ? "border-theme-green/30 bg-theme-green/10 text-theme-green"
                  : "border-border-soft bg-surface text-text-primary hover:border-theme-blue/20 hover:bg-theme-blue/5"
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelected?.(evidence.id)}
                className="accent-theme-green"
              />
              {selected ? "Added" : "Add this quote"}
            </label>
          ) : null}
        </div>
      </div>

      {evidence.quote ? (
        <blockquote className="mt-3 rounded-lg bg-surface-soft px-4 py-3 text-sm italic leading-relaxed text-theme-dark/85">
          &ldquo;{evidence.quote}&rdquo;
        </blockquote>
      ) : null}

      {observationLine ? (
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          <span className="font-semibold text-text-primary">Observation: </span>
          {observationLine}
        </p>
      ) : null}

      {children ? <div className="mt-4 border-t border-border-soft pt-4">{children}</div> : null}

      {hasExpandedDetails ? (
        <details className="mt-4 rounded-lg border border-border-soft bg-surface">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-theme-blue transition-colors duration-150 hover:bg-theme-blue/5">
            <span className="inline-flex items-center gap-2">
              <span>Show details</span>
              {marker ? <MetaTag tone="marker">{MARKER_LABELS[marker]}</MetaTag> : null}
            </span>
          </summary>
          <div className="space-y-3 border-t border-border-soft px-4 py-3 text-left">
            {onMarkerChange ? (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Marker
                </span>
                <select
                  value={marker}
                  onChange={(event) => onMarkerChange?.(evidence.id, event.target.value)}
                  className="w-full rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary transition-colors duration-150 focus:border-theme-blue focus:outline-none focus:ring-2 focus:ring-theme-blue/15"
                >
                  <option value="">No marker</option>
                  {Object.entries(MARKER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {evidence.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {evidence.tags.map((tag) => (
                  <MetaTag key={`${evidence.id}-${tag}`}>{tag}</MetaTag>
                ))}
              </div>
            ) : null}

            {Boolean(evidence.observation) && observationLine !== evidence.observation.trim() ? (
              <p className="text-sm leading-relaxed text-text-muted">
                <span className="font-semibold text-text-primary">Full observation: </span>
                {evidence.observation}
              </p>
            ) : null}

            {!compact && evidence.audienceEffect ? (
              <p className="text-sm leading-relaxed text-text-muted">
                <span className="font-semibold text-text-primary">Audience effect: </span>
                {evidence.audienceEffect}
              </p>
            ) : null}

            {!compact && evidence.purposeConnection ? (
              <p className="text-sm leading-relaxed text-text-muted">
                <span className="font-semibold text-text-primary">Purpose connection: </span>
                {evidence.purposeConnection}
              </p>
            ) : null}

            {!compact && evidence.essentialQuestionConnection ? (
              <p className="text-sm leading-relaxed text-text-muted">
                <span className="font-semibold text-text-primary">Essential question: </span>
                {evidence.essentialQuestionConnection}
              </p>
            ) : null}
          </div>
        </details>
      ) : null}
    </Card>
  );
}
