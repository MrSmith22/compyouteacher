import type { StudentBucketsRow } from "@/lib/supabase/helpers/studentBuckets";
import type { StudentBucketFlowState } from "@/lib/supabase/helpers/module4ParagraphPlans";
import {
  getModule4ParagraphPlansAdmin,
  upsertModule4ParagraphPlansAdmin,
} from "@/lib/supabase/helpers/module4ParagraphPlans";

export type ParagraphPlanWriteInput = {
  userEmail: string;
  buckets: unknown[];
  reflection?: string;
  flow_state?: StudentBucketFlowState | null;
};

export async function upsertParagraphPlansForUser(input: ParagraphPlanWriteInput) {
  const writeRes = await upsertModule4ParagraphPlansAdmin({
    userEmail: input.userEmail,
    buckets: input.buckets,
    reflection: input.reflection,
    flow_state: input.flow_state ?? null,
  });

  if (writeRes.error) {
    return { ok: false as const, error: writeRes.error };
  }

  return { ok: true as const };
}

export async function getParagraphPlansForUser(userEmail: string) {
  const res = await getModule4ParagraphPlansAdmin({ userEmail });

  if (res.error) {
    return {
      ok: false as const,
      error: res.error,
      data: null as StudentBucketsRow | null,
    };
  }

  return { ok: true as const, data: res.data };
}
