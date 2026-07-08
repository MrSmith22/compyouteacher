export type ArtifactPresentationKey =
  | "source"
  | "evidence"
  | "evidence_cluster"
  | "pattern"
  | "idea"
  | "claim"
  | "thesis"
  | "proof_plan"
  | "outline"
  | "draft";

export type ArtifactPresentation = {
  key: ArtifactPresentationKey;
  label: string;
  icon: string;
  colorToken: string;
  description?: string;
  chipClassName: string;
  badgeClassName: string;
  accentClassName: string;
  softSurfaceClassName: string;
};

export const artifactPresentationRegistry: Record<
  ArtifactPresentationKey,
  ArtifactPresentation
> = {
  source: {
    key: "source",
    label: "Source",
    icon: "book",
    colorToken: "theme-blue",
    description: "Assignment texts and source context",
    chipClassName: "bg-theme-blue/10 text-theme-blue border-theme-blue/15",
    badgeClassName: "bg-theme-blue/10 text-theme-blue",
    accentClassName: "text-theme-blue",
    softSurfaceClassName: "bg-theme-blue/5 border-theme-blue/15",
  },
  evidence: {
    key: "evidence",
    label: "Evidence",
    icon: "quote",
    colorToken: "theme-green",
    description: "Quotes, observations, and supporting details",
    chipClassName: "bg-theme-green/10 text-theme-green border-theme-green/15",
    badgeClassName: "bg-theme-green/10 text-theme-green",
    accentClassName: "text-theme-green",
    softSurfaceClassName: "bg-theme-green/5 border-theme-green/15",
  },
  evidence_cluster: {
    key: "evidence_cluster",
    label: "Evidence Cluster",
    icon: "stack",
    colorToken: "theme-dark-blue",
    description: "Grouped evidence worth thinking with together",
    chipClassName:
      "bg-theme-dark-blue/10 text-theme-dark-blue border-theme-dark-blue/15",
    badgeClassName: "bg-theme-dark-blue/10 text-theme-dark-blue",
    accentClassName: "text-theme-dark-blue",
    softSurfaceClassName: "bg-theme-dark-blue/5 border-theme-dark-blue/15",
  },
  pattern: {
    key: "pattern",
    label: "Pattern",
    icon: "spark",
    colorToken: "theme-orange",
    description: "A relationship that emerges across evidence",
    chipClassName: "bg-theme-orange/10 text-theme-orange border-theme-orange/15",
    badgeClassName: "bg-theme-orange/10 text-theme-orange",
    accentClassName: "text-theme-orange",
    softSurfaceClassName: "bg-theme-orange/5 border-theme-orange/15",
  },
  idea: {
    key: "idea",
    label: "Idea",
    icon: "lightbulb",
    colorToken: "theme-deep-green",
    description: "A provisional interpretation worth exploring",
    chipClassName:
      "bg-theme-deep-green/10 text-theme-deep-green border-theme-deep-green/15",
    badgeClassName: "bg-theme-deep-green/10 text-theme-deep-green",
    accentClassName: "text-theme-deep-green",
    softSurfaceClassName: "bg-theme-deep-green/5 border-theme-deep-green/15",
  },
  claim: {
    key: "claim",
    label: "Claim",
    icon: "statement",
    colorToken: "theme-blue",
    description: "A supported position the student can defend",
    chipClassName: "bg-theme-blue/10 text-theme-blue border-theme-blue/15",
    badgeClassName: "bg-theme-blue/10 text-theme-blue",
    accentClassName: "text-theme-blue",
    softSurfaceClassName: "bg-theme-blue/5 border-theme-blue/15",
  },
  thesis: {
    key: "thesis",
    label: "Thesis",
    icon: "flag",
    colorToken: "theme-dark",
    description: "The central supported argument",
    chipClassName: "bg-theme-dark/10 text-theme-dark border-theme-dark/15",
    badgeClassName: "bg-theme-dark/10 text-theme-dark",
    accentClassName: "text-theme-dark",
    softSurfaceClassName: "bg-theme-dark/5 border-theme-dark/15",
  },
  proof_plan: {
    key: "proof_plan",
    label: "Proof Plan",
    icon: "list",
    colorToken: "theme-orange",
    description: "The main directions the thesis must prove",
    chipClassName: "bg-theme-orange/10 text-theme-orange border-theme-orange/15",
    badgeClassName: "bg-theme-orange/10 text-theme-orange",
    accentClassName: "text-theme-orange",
    softSurfaceClassName: "bg-theme-orange/5 border-theme-orange/15",
  },
  outline: {
    key: "outline",
    label: "Outline",
    icon: "outline",
    colorToken: "theme-dark",
    description: "Structured outline work from later modules",
    chipClassName: "bg-theme-dark/10 text-theme-dark border-theme-dark/15",
    badgeClassName: "bg-theme-dark/10 text-theme-dark",
    accentClassName: "text-theme-dark",
    softSurfaceClassName: "bg-theme-dark/5 border-theme-dark/15",
  },
  draft: {
    key: "draft",
    label: "Draft",
    icon: "draft",
    colorToken: "theme-blue",
    description: "Draft writing and section development",
    chipClassName: "bg-theme-blue/10 text-theme-blue border-theme-blue/15",
    badgeClassName: "bg-theme-blue/10 text-theme-blue",
    accentClassName: "text-theme-blue",
    softSurfaceClassName: "bg-theme-blue/5 border-theme-blue/15",
  },
};

export function getArtifactPresentation(
  key: ArtifactPresentationKey
): ArtifactPresentation {
  return artifactPresentationRegistry[key];
}
