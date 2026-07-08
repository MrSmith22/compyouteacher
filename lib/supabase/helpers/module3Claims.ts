import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";
import { asTrimmedString } from "@/lib/parsing/coerce";
import { readRowRefIds } from "@/lib/module3/rowMetadata";
import {
  getModule3StudentBucketAdmin,
  upsertModule3ScalarFlowStateAdmin,
} from "@/lib/supabase/helpers/module3FlowState";

export type Module3ClaimRow = {
  workingClaim: string;
  supportRationale: string;
  clusterId?: string | null;
  patternId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function asClaim(value: unknown): Module3ClaimRow | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const workingClaim = asTrimmedString(record.workingClaim);
  const supportRationale = asTrimmedString(record.supportRationale);

  if (!workingClaim && !supportRationale) return null;

  return {
    workingClaim,
    supportRationale,
    ...readRowRefIds(record),
  };
}

export async function getModule3ClaimAdmin({ userEmail }: { userEmail: string }) {
  const res = await getModule3StudentBucketAdmin({ userEmail });
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
  return upsertModule3ScalarFlowStateAdmin({
    userEmail,
    key: "module3Claim",
    value: claim,
  });
}
