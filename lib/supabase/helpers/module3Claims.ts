import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";
import { getStudentBucketsAdmin, upsertStudentBucketsAdmin } from "@/lib/supabase/helpers/studentBuckets";

export type Module3ClaimRow = {
  workingClaim: string;
  supportRationale: string;
  clusterId?: string | null;
  patternId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const MODULE_NUMBER = 3;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asClaim(value: unknown): Module3ClaimRow | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const workingClaim = asString(record.workingClaim).trim();
  const supportRationale = asString(record.supportRationale).trim();

  if (!workingClaim && !supportRationale) return null;

  return {
    workingClaim,
    supportRationale,
    clusterId: asString(record.clusterId).trim() || null,
    patternId: asString(record.patternId).trim() || null,
    createdAt: asString(record.createdAt).trim() || null,
    updatedAt: asString(record.updatedAt).trim() || null,
  };
}

export async function getModule3ClaimAdmin({ userEmail }: { userEmail: string }) {
  const res = await getStudentBucketsAdmin({ userEmail, module: MODULE_NUMBER });
  if (res.error) return { claim: null, error: res.error };
  const flowState = (res.data?.flow_state ?? null) as StudentBucketFlowState | null;
  const claim = asClaim(flowState?.module3Claim);
  return { claim, error: null };
}

export async function upsertModule3ClaimAdmin({
  userEmail,
  claim,
}: {
  userEmail: string;
  claim: Module3ClaimRow | null;
}) {
  const existingRes = await getStudentBucketsAdmin({ userEmail, module: MODULE_NUMBER });
  if (existingRes.error) return { data: null, error: existingRes.error };
  const existing = existingRes.data ?? null;

  const existingFlowState = (existing?.flow_state ?? null) as StudentBucketFlowState | null;
  const nextFlowState: StudentBucketFlowState = {
    ...(existingFlowState || {}),
    module3Claim: claim,
  };

  if (!claim) {
    delete nextFlowState.module3Claim;
  }

  return upsertStudentBucketsAdmin({
    userEmail,
    module: MODULE_NUMBER,
    buckets: existing?.buckets ?? [],
    reflection: existing?.reflection ?? null,
    flow_state: nextFlowState,
  });
}
