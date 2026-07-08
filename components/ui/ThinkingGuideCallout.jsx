import SectionCard from "@/components/ui/SectionCard";

export default function ThinkingGuideCallout({
  eyebrow,
  title,
  children,
  className = "",
}) {
  return (
    <SectionCard
      eyebrow={eyebrow}
      title={title}
      className={className}
      padding="sm"
    >
      <div className="space-y-3 text-left text-sm text-text-muted">{children}</div>
    </SectionCard>
  );
}
