import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";
import { asStringArray, asTrimmedString } from "@/lib/parsing/coerce";
import { readRowRefIds } from "@/lib/module3/rowMetadata";
import {
  getModule3StudentBucketAdmin,
  upsertModule3FlowStatePatchAdmin,
} from "@/lib/supabase/helpers/module3FlowState";

export type Module3MatrixProvenance = {
  schemaVersion?: number;
  signature?: string;
  selectedPatternOptionId?: string | null;
  selectedPatternKind?: string | null;
  selectedPatternLabel?: string | null;
  evidenceIds?: string[];
  appeals?: string[];
  ratings?: Record<string, unknown>;
  audiencePurposeReasoning?: string;
  importedAt?: string | null;
};

export type Module3MatrixReview = {
  needsReview?: boolean;
  reasonCodes?: string[];
  reviewedSignature?: string | null;
  reviewedAt?: string | null;
};

export type Module3PatternRow = {
  id: string;
  text: string;
  evidenceIds: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
  /** Additive CP-D matrix provenance — legacy rows omit this. */
  matrixProvenance?: Module3MatrixProvenance | null;
  matrixReview?: Module3MatrixReview | null;
};

function asOptionalObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asPattern(value: unknown): Module3PatternRow | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = asTrimmedString(record.id);
  const text = asTrimmedString(record.text);
  const evidenceIds = asStringArray(record.evidenceIds);

  if (!id) return null;

  const refs = readRowRefIds(record);
  const matrixProvenance = asOptionalObject(record.matrixProvenance);
  const matrixReview = asOptionalObject(record.matrixReview);

  return {
    id,
    text,
    evidenceIds,
    createdAt: refs.createdAt,
    updatedAt: refs.updatedAt,
    ...(matrixProvenance ? { matrixProvenance: matrixProvenance as Module3MatrixProvenance } : {}),
    ...(matrixReview ? { matrixReview: matrixReview as Module3MatrixReview } : {}),
  };
}

function normalizePatterns(value: unknown): Module3PatternRow[] {
  if (!Array.isArray(value)) return [];
  return value.map(asPattern).filter(Boolean) as Module3PatternRow[];
}

function readPatternState(flowState: StudentBucketFlowState | null | undefined) {
  const patterns = normalizePatterns(flowState?.module3Patterns);
  const selectedPatternId = asTrimmedString(flowState?.module3SelectedPatternId) || null;
  return { patterns, selectedPatternId };
}

export async function getModule3PatternsAdmin({ userEmail }: { userEmail: string }) {
  const res = await getModule3StudentBucketAdmin({ userEmail });
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
  return upsertModule3FlowStatePatchAdmin({
    userEmail,
    patch: {
      module3Patterns: patterns,
      module3SelectedPatternId: selectedPatternId ?? null,
    },
  });
}
