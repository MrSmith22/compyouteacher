import { getEssayProseBlocks } from "@/components/module7/module7DraftSections";

/**
 * Renders the student essay as writing representation only (prose paragraphs).
 * Planning labels (Roman numerals, outline/bucket titles) must never appear here.
 */
export default function EssayProseView({
  sectionSteps,
  sections,
  blockClassName = "mb-6 last:mb-0",
  emptyFallback = null,
}) {
  const blocks = getEssayProseBlocks(sectionSteps, sections);

  if (blocks.length === 0) {
    return emptyFallback;
  }

  return blocks.map(({ key, text }) => (
    <div key={key} className={blockClassName}>
      <p className="whitespace-pre-wrap">{text}</p>
    </div>
  ));
}
