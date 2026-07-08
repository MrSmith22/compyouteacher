import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";
import { getStudentBucketsAdmin, upsertStudentBucketsAdmin } from "@/lib/supabase/helpers/studentBuckets";

export type Module3PatternRow = {
  id: string;
  text: string;
  evidenceIds: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

const MODULE_NUMBER = 3;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item).trim()).filter(Boolean);
}

function asPattern(value: unknown): Module3PatternRow | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = asString(record.id).trim();
  const text = asString(record.text).trim();
  const evidenceIds = asStringArray(record.evidenceIds);

  if (!id) return null;

  return {
    id,
    text,
    evidenceIds,
    createdAt: asString(record.createdAt).trim() || null,
    updatedAt: asString(record.updatedAt).trim() || null,
  };
}

function normalizePatterns(value: unknown): Module3PatternRow[] {
  if (!Array.isArray(value)) return [];
  return value.map(asPattern).filter(Boolean) as Module3PatternRow[];
}

function readPatternState(flowState: StudentBucketFlowState | null | undefined) {
  const patterns = normalizePatterns(flowState?.module3Patterns);
  const selectedPatternId = asString(flowState?.module3SelectedPatternId).trim() || null;
  return { patterns, selectedPatternId };
}

export async function getModule3PatternsAdmin({ userEmail }: { userEmail: string }) {
  const res = await getStudentBucketsAdmin({ userEmail, module: MODULE_NUMBER });
  if (res.error) return { patterns: [], selectedPatternId: null, error: res.error };
  const row = res.data ?? null;
  const { patterns, selectedPatternId } = readPatternState(row?.flow_state ?? null);
  return { patterns, selectedPatternId, error: null };
}

export async function upsertModule3PatternsAdmin({
  userEmail,
  patterns,
  selectedPatternId,
}: {
  userEmail: string;
  patterns: Module3PatternRow[];
  selectedPatternId: string | null;
}) {
  const existingRes = await getStudentBucketsAdmin({ userEmail, module: MODULE_NUMBER });
  if (existingRes.error) return { data: null, error: existingRes.error };
  const existing = existingRes.data ?? null;

  const existingFlowState = (existing?.flow_state ?? null) as StudentBucketFlowState | null;
  const nextFlowState: StudentBucketFlowState = {
    ...(existingFlowState || {}),
    module3Patterns: patterns,
    module3SelectedPatternId: selectedPatternId ?? null,
  };

  return upsertStudentBucketsAdmin({
    userEmail,
    module: MODULE_NUMBER,
    buckets: existing?.buckets ?? [],
    reflection: existing?.reflection ?? null,
    flow_state: nextFlowState,
  });
}

