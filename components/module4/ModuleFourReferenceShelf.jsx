import Card from "@/components/ui/Card";
import ArtifactChip from "@/components/ui/ArtifactChip";

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

function ParagraphBucketPreview({ index, bucket, isActive, isComplete }) {
  const claim = (bucket?.claim || "").trim();
  const label = `Paragraph ${index + 1}`;

  return (
    <div
      className={[
        "rounded-lg border px-3 py-2 text-left",
        isActive
          ? "border-theme-blue/30 bg-theme-blue/5"
          : isComplete
            ? "border-border-soft bg-white/80"
            : "border-border-soft/70 bg-surface-soft/40",
      ].join(" ")}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
        {isActive ? " · on your desk" : isComplete ? " · planned" : ""}
      </p>
      <p className="mt-1 text-sm text-text-primary whitespace-pre-wrap">
        {claim || "—"}
      </p>
    </div>
  );
}

export default function ModuleFourReferenceShelf({
  assignmentQuestion = "",
  thesis = "",
  proofPlan = [],
  patternText = "",
  clusterName = "",
  clusterReflection = "",
  claimText = "",
  ideaText = "",
  buckets = [],
  activeBucketIndex = -1,
  completedBucketIndices = [],
}) {
  const bucketSlots = [0, 1, 2];
  const completedSet = new Set(completedBucketIndices);

  return (
    <aside className="space-y-4 text-left">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
          On the shelf
        </p>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          Your thesis, proof directions, and earlier paragraph plans stay here while you
          work on one paragraph at a time.
        </p>
      </div>

      <Card padding="sm" elevation="soft" surface="soft" className="space-y-4">
        <ShelfSection title="Assignment question" emptyText="Your assignment question will appear here.">
          {assignmentQuestion ? (
            <p className="text-sm leading-relaxed text-text-primary">{assignmentQuestion}</p>
          ) : null}
        </ShelfSection>

        <ShelfSection title="Thesis" artifactType="thesis" emptyText="Your thesis from Module 3 will appear here.">
          {thesis ? (
            <p className="whitespace-pre-wrap text-sm text-text-primary">{thesis}</p>
          ) : null}
        </ShelfSection>

        <ShelfSection
          title="Proof plan"
          artifactType="proof_plan"
          emptyText="Proof directions from Module 3 will appear here when you have them."
        >
          {proofPlan.length > 0 ? (
            <ol className="list-decimal list-inside space-y-1 text-sm text-text-primary">
              {proofPlan.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          ) : null}
        </ShelfSection>

        <ShelfSection title="Pattern" artifactType="pattern" emptyText="Your pattern from Module 3 will appear here.">
          {patternText ? (
            <p className="whitespace-pre-wrap text-sm text-text-primary">{patternText}</p>
          ) : null}
        </ShelfSection>

        <ShelfSection
          title="Evidence cluster"
          artifactType="evidence_cluster"
          emptyText="Your working evidence group from Module 3 will appear here."
        >
          {clusterName ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-text-primary">{clusterName}</p>
              {clusterReflection ? (
                <p className="text-xs leading-relaxed text-text-muted">{clusterReflection}</p>
              ) : null}
            </div>
          ) : null}
        </ShelfSection>

        <ShelfSection title="Claim" artifactType="claim" emptyText="Your working claim from Module 3 will appear here.">
          {claimText ? (
            <p className="whitespace-pre-wrap text-sm text-text-primary">{claimText}</p>
          ) : null}
        </ShelfSection>

        <ShelfSection title="Idea" artifactType="idea" emptyText="Your exploratory idea from Module 3 will appear here.">
          {ideaText ? (
            <p className="whitespace-pre-wrap text-sm text-text-primary">{ideaText}</p>
          ) : null}
        </ShelfSection>

        <ShelfSection
          title="Other paragraph plans"
          emptyText="Paragraph plans you finish will gather here."
        >
          <div className="space-y-2">
            {bucketSlots.map((index) => {
              const bucket = buckets[index];
              const isActive = index === activeBucketIndex;
              const isComplete = completedSet.has(index);
              const hasContent = Boolean((bucket?.claim || "").trim());

              if (!hasContent && !isActive && !isComplete && index > 1) {
                return null;
              }

              return (
                <ParagraphBucketPreview
                  key={index}
                  index={index}
                  bucket={bucket}
                  isActive={isActive}
                  isComplete={isComplete}
                />
              );
            })}
          </div>
        </ShelfSection>
      </Card>
    </aside>
  );
}
