import { getArtifactPresentation } from "@/lib/artifacts/artifactPresentation";

export default function ArtifactChip({
  artifactType,
  label,
  className = "",
  selected = false,
}) {
  const presentation = getArtifactPresentation(artifactType);

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        presentation.chipClassName,
        selected ? "ring-1 ring-offset-1 ring-theme-blue/20" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={presentation.description}
    >
      <span
        aria-hidden="true"
        className={["h-1.5 w-1.5 rounded-full", presentation.accentClassName.replace("text-", "bg-")].join(" ")}
      />
      <span>{label || presentation.label}</span>
    </span>
  );
}
