import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";
import { getStudentBucketsAdmin, upsertStudentBucketsAdmin } from "@/lib/supabase/helpers/studentBuckets";

export type Module3IdeaRow = {
  statement: string;
  whyMatters: string;
  clusterId?: string | null;
  patternId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const MODULE_NUMBER = 3;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asIdea(value: unknown): Module3IdeaRow | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const statement = asString(record.statement).trim();
  const whyMatters = asString(record.whyMatters).trim();

  if (!statement && !whyMatters) return null;

  return {
    statement,
    whyMatters,
    clusterId: asString(record.clusterId).trim() || null,
    patternId: asString(record.patternId).trim() || null,
    createdAt: asString(record.createdAt).trim() || null,
    updatedAt: asString(record.updatedAt).trim() || null,
  };
}

export async function getModule3IdeaAdmin({ userEmail }: { userEmail: string }) {
  const res = await getStudentBucketsAdmin({ userEmail, module: MODULE_NUMBER });
  if (res.error) return { idea: null, error: res.error };
  const flowState = (res.data?.flow_state ?? null) as StudentBucketFlowState | null;
  const idea = asIdea(flowState?.module3Idea);
  return { idea, error: null };
}

export async function upsertModule3IdeaAdmin({
  userEmail,
  idea,
}: {
  userEmail: string;
  idea: Module3IdeaRow | null;
}) {
  const existingRes = await getStudentBucketsAdmin({ userEmail, module: MODULE_NUMBER });
  if (existingRes.error) return { data: null, error: existingRes.error };
  const existing = existingRes.data ?? null;

  const existingFlowState = (existing?.flow_state ?? null) as StudentBucketFlowState | null;
  const nextFlowState: StudentBucketFlowState = {
    ...(existingFlowState || {}),
    module3Idea: idea,
  };

  if (!idea) {
    delete nextFlowState.module3Idea;
  }

  return upsertStudentBucketsAdmin({
    userEmail,
    module: MODULE_NUMBER,
    buckets: existing?.buckets ?? [],
    reflection: existing?.reflection ?? null,
    flow_state: nextFlowState,
  });
}
