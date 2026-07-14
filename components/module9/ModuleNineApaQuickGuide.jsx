"use client";

import ModuleNineDisclosure from "@/components/module9/ModuleNineDisclosure";
import ModuleNineApaVisual from "@/components/module9/ModuleNineApaVisual";
import {
  MODULE9_APA_SECONDARY_RESOURCES,
  getModule9ApaQuickGuideSections,
} from "@/lib/module9/module9ApaLearning";
import { HIERARCHY_REFERENCE_LINK_CLASS } from "@/lib/ui/hierarchyContract";

/**
 * Internal APA Quick Guide — same content model as the lesson.
 * Progressive disclosure; optional external links stay secondary.
 */
export default function ModuleNineApaQuickGuide({
  highlightConceptId = null,
  defaultOpen = false,
  compact = false,
}) {
  const sections = getModule9ApaQuickGuideSections();

  return (
    <aside
      className="overflow-x-hidden rounded-xl border border-role-reference/30 bg-role-reference/[0.06] px-4 py-3 shadow-soft"
      data-testid="module9-apa-quick-guide"
      data-instructional-color-role="reference"
      aria-label="APA Quick Guide"
    >
      <ModuleNineDisclosure
        title="APA Quick Guide"
        defaultOpen={defaultOpen}
        data-testid="module9-apa-quick-guide-toggle"
      >
        <p className="text-sm leading-relaxed text-text-primary">
          Use this guide for the APA choices this assignment requires. It matches
          what you practice in the lesson.
        </p>

        <div className="mt-3 space-y-2">
          {sections.map((section) => (
            <ModuleNineDisclosure
              key={section.id}
              title={section.title}
              defaultOpen={highlightConceptId === section.id}
              data-testid={`module9-guide-section-${section.id}`}
            >
              <p className="text-sm font-semibold text-text-primary">
                {section.summary}
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                {section.whatToDo}
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                Why it matters: {section.whyItMatters}
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                {section.assignmentRule}
              </p>
              {!compact ? (
                <ModuleNineApaVisual
                  visualId={section.visualId}
                  caption={section.visualCaption}
                  alt={section.visualAlt}
                  className="mt-2"
                />
              ) : null}
              <p className="text-xs font-medium text-text-muted">
                Checklist: {section.checklistWording}
              </p>
            </ModuleNineDisclosure>
          ))}
        </div>

        <div className="mt-3 border-t border-border-soft/60 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Optional extras
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-text-muted">
            {MODULE9_APA_SECONDARY_RESOURCES.map((resource) => (
              <li key={resource.id}>
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={HIERARCHY_REFERENCE_LINK_CLASS}
                >
                  {resource.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </ModuleNineDisclosure>
    </aside>
  );
}
