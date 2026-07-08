import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";
import {
  getStudentBucketsAdmin,
  upsertStudentBucketsAdmin,
} from "@/lib/supabase/helpers/studentBuckets";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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

const MODULE_NUMBER = 3;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function asThesis(value: unknown): Module3ThesisRow | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const thesis = asString(record.thesis).trim();
  const proofPlan = asStringArray(record.proofPlan);

  if (!thesis && proofPlan.length === 0) return null;

  return {
    thesis,
    proofPlan,
    clusterId: asString(record.clusterId).trim() || null,
    patternId: asString(record.patternId).trim() || null,
    createdAt: asString(record.createdAt).trim() || null,
    updatedAt: asString(record.updatedAt).trim() || null,
  };
}

export async function getModule3ThesisAdmin({ userEmail }: { userEmail: string }) {
  const res = await getStudentBucketsAdmin({ userEmail, module: MODULE_NUMBER });
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
  const existingRes = await getStudentBucketsAdmin({
    userEmail,
    module: MODULE_NUMBER,
  });
  if (existingRes.error) return { data: null, error: existingRes.error };
  const existing = existingRes.data ?? null;

  const existingFlowState = (existing?.flow_state ?? null) as StudentBucketFlowState | null;
  const nextFlowState: StudentBucketFlowState = {
    ...(existingFlowState || {}),
    module3Thesis: thesis,
  };

  if (!thesis) {
    delete nextFlowState.module3Thesis;
  }

  return upsertStudentBucketsAdmin({
    userEmail,
    module: MODULE_NUMBER,
    buckets: existing?.buckets ?? [],
    reflection: existing?.reflection ?? null,
    flow_state: nextFlowState,
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

