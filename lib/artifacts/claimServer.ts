import {
  getModule3ClaimAdmin,
  upsertModule3ClaimAdmin,
  type Module3ClaimRow,
} from "@/lib/supabase/helpers/module3Claims";
import { mergeOptionalRef, mergeTimestamps } from "@/lib/artifacts/server/rowMerge";

export type ClaimWriteInput = {
  userEmail: string;
  workingClaim?: string;
  supportRationale?: string;
  clusterId?: string | null;
  patternId?: string | null;
};

function isEmptyClaim(claim: Module3ClaimRow) {
  return !claim.workingClaim.trim() && !claim.supportRationale.trim();
}

function buildClaimRow(
  input: ClaimWriteInput,
  existing: Module3ClaimRow | null
): Module3ClaimRow {
  const timestamps = mergeTimestamps(existing?.createdAt);
  const workingClaim =
    input.workingClaim !== undefined
      ? input.workingClaim.trim()
      : (existing?.workingClaim ?? "");
  const supportRationale =
    input.supportRationale !== undefined
      ? input.supportRationale.trim()
      : (existing?.supportRationale ?? "");

  return {
    workingClaim,
    supportRationale,
    clusterId: mergeOptionalRef(input.clusterId, existing?.clusterId ?? null),
    patternId: mergeOptionalRef(input.patternId, existing?.patternId ?? null),
    ...timestamps,
  };
}

export async function upsertClaimForUser(input: ClaimWriteInput) {
  const res = await getModule3ClaimAdmin({ userEmail: input.userEmail });
  if (res.error) return { ok: false as const, error: res.error };

  const nextClaim = buildClaimRow(input, res.claim);
  if (isEmptyClaim(nextClaim)) {
    return deleteClaimForUser({ userEmail: input.userEmail });
  }

  const writeRes = await upsertModule3ClaimAdmin({
    userEmail: input.userEmail,
    claim: nextClaim,
  });

  if (writeRes.error) return { ok: false as const, error: writeRes.error };
  return { ok: true as const, claim: nextClaim };
}

export async function deleteClaimForUser({ userEmail }: { userEmail: string }) {
  const writeRes = await upsertModule3ClaimAdmin({
    userEmail,
    claim: null,
  });

  if (writeRes.error) return { ok: false as const, error: writeRes.error };
  return { ok: true as const };
}

export async function getClaimForUser(userEmail: string) {
  const res = await getModule3ClaimAdmin({ userEmail });
  if (res.error) {
    return { ok: false as const, error: res.error, claim: null as Module3ClaimRow | null };
  }

  return { ok: true as const, claim: res.claim };
}
