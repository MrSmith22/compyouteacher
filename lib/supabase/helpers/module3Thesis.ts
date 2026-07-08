import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { asStringArray, asTrimmedString } from "@/lib/parsing/coerce";
import { readRowRefIds } from "@/lib/module3/rowMetadata";
import {
  getModule3StudentBucketAdmin,
  upsertModule3ScalarFlowStateAdmin,
} from "@/lib/supabase/helpers/module3FlowState";

export type Module3ThesisRow = {
  thesis: string;
  proofPlan: string[];
  clusterId?: string | null;
  patternId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type Module3ResponsesRow = {
  thesis: string | null;
  updated_at: string | null;
};

function asThesis(value: unknown): Module3ThesisRow | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const thesis = asTrimmedString(record.thesis);
  const proofPlan = asStringArray(record.proofPlan);

  if (!thesis && proofPlan.length === 0) return null;

  return {
    thesis,
    proofPlan,
    ...readRowRefIds(record),
  };
}

export async function getModule3ThesisAdmin({ userEmail }: { userEmail: string }) {
  const res = await getModule3StudentBucketAdmin({ userEmail });
  if (res.error) return { thesis: null, error: res.error };
  const flowState = (res.data?.flow_state ?? null) as StudentBucketFlowState | null;
  const thesis = asThesis(flowState?.module3Thesis);
  return { thesis, error: null };
}

export async function upsertModule3ThesisAdmin({
  userEmail,
  thesis,
}: {
  userEmail: string;
  thesis: Module3ThesisRow | null;
}) {
  return upsertModule3ScalarFlowStateAdmin({
    userEmail,
    key: "module3Thesis",
    value: thesis,
  });
}

/**
 * Compatibility mirror for downstream modules that still read `module3_responses.thesis`.
 * This does NOT replace the primary Module 3 V2 persistence in `student_buckets.flow_state`.
 */
export async function upsertModule3ResponsesThesisAdmin({
  userEmail,
  thesis,
}: {
  userEmail: string;
  thesis: string | null;
}) {
  const supabase = getSupabaseAdmin();

  const existing = await supabase
    .from("module3_responses")
    .select("thesis, updated_at")
    .eq("user_email", userEmail)
    .maybeSingle<Module3ResponsesRow>();

  if (existing.error) {
    return { data: null, error: existing.error };
  }

  if (existing.data) {
    return supabase
      .from("module3_responses")
      .update({
        thesis: thesis,
        updated_at: new Date().toISOString(),
      })
      .eq("user_email", userEmail);
  }

  return supabase.from("module3_responses").insert({
    user_email: userEmail,
    thesis: thesis,
    updated_at: new Date().toISOString(),
  });
}
