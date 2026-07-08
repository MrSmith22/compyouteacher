import { getArtifactPresentation } from "@/lib/artifacts/artifactPresentation";

export default function ArtifactBadge({
  artifactType,
  count,
  label,
  className = "",
}) {
  const presentation = getArtifactPresentation(artifactType);

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold",
        presentation.badgeClassName,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={presentation.description}
    >
      {label ? <span>{label}</span> : null}
      <span>{count}</span>
    </span>
  );
}
