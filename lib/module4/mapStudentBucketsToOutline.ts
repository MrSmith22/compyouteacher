export type TchartLike = {
  id?: string | number | null;
  category?: string | null;
  type?: string | null;
  quote?: string | null;
  observation?: string | null;
};

export type StudentBucketPayload = {
  claim?: string;
  reasoning?: string;
  evidenceKeys?: string[];
  evidenceSnippets?: Array<{ quote?: string; observation?: string }>;
  /** Module 4 scaffolding; ignored when building Module 5 outline. */
  paragraphRole?: string;
  suggestionId?: string;
};

export type OutlineBodyItem = {
  bucket: string;
  points: string[];
};

/** Stable key for matching Module 2 rows (id when present, else category|type). */
export function tchartEntryKey(row: TchartLike): string {
  if (row?.id != null && String(row.id).length > 0) return String(row.id);
  return `${row?.category ?? ""}|${row?.type ?? ""}`;
}

/**
 * Builds Module 5 outline.body cards from Module 4 `student_buckets.buckets` JSON.
 * Uses denormalized evidenceSnippets when present; otherwise resolves keys against tchart rows.
 */
export function outlineBodyFromStudentBuckets(
  bucketsPayload: StudentBucketPayload[] | null | undefined,
  tchartRows: TchartLike[]
): OutlineBodyItem[] {
  const list = Array.isArray(bucketsPayload) ? bucketsPayload : [];
  const keyToRow: Record<string, TchartLike> = {};
  for (const row of tchartRows || []) {
    keyToRow[tchartEntryKey(row)] = row;
  }

  return list.map((b) => {
    let snippets = Array.isArray(b.evidenceSnippets)
      ? b.evidenceSnippets
      : [];

    if (!snippets.length && Array.isArray(b.evidenceKeys)) {
      snippets = b.evidenceKeys
        .map((k) => {
          const row = keyToRow[k];
          if (!row) return null;
          return { quote: row.quote ?? "", observation: row.observation ?? "" };
        })
        .filter(Boolean) as Array<{ quote?: string; observation?: string }>;
    }

    const points = snippets
      .map((s) => {
        const obs = String(s?.observation ?? "").trim();
        const quote = String(s?.quote ?? "").trim();
        const line = `${obs}${quote ? ` — "${quote}"` : ""}`.trim();
        return line;
      })
      .filter(Boolean);

    const reasoning = String(b?.reasoning ?? "").trim();
    if (reasoning) points.push(reasoning);

    return {
      bucket: String(b?.claim ?? "").trim() || "Body paragraph",
      points: points.length ? points : [""],
    };
  });
}
