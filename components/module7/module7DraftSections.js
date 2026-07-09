export function getSectionCountFromOutline(outline) {
  const body = Array.isArray(outline?.body) ? outline.body : [];
  return 1 + body.length + 1;
}

export function alignSectionsToOutline(parts, sectionCount) {
  const normalized = Array.isArray(parts) ? parts.map((part) => String(part ?? "")) : [];
  if (sectionCount <= 0) {
    return normalized.length ? normalized : [""];
  }
  if (normalized.length === sectionCount) return normalized;
  if (normalized.length < sectionCount) {
    return [...normalized, ...Array(sectionCount - normalized.length).fill("")];
  }
  const head = normalized.slice(0, sectionCount - 1);
  const tail = normalized.slice(sectionCount - 1).join("\n\n");
  return [...head, tail];
}

export function splitDraftIntoSections(fullText, sectionCount) {
  const trimmed = typeof fullText === "string" ? fullText : "";
  if (!trimmed.trim()) {
    return Array(Math.max(sectionCount, 1)).fill("");
  }
  return alignSectionsToOutline(trimmed.split(/\n\n/), sectionCount);
}

export function joinSections(sections) {
  return (Array.isArray(sections) ? sections : []).join("\n\n");
}
