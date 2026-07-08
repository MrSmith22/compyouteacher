import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";
import {
  getStudentBucketsAdmin,
  upsertStudentBucketsAdmin,
  type StudentBucketsRow,
} from "@/lib/supabase/helpers/studentBuckets";

export const MODULE4_NUMBER = 4;

export async function getModule4ParagraphPlansAdmin({
  userEmail,
}: {
  userEmail: string;
}): Promise<{ data: StudentBucketsRow | null; error: { message?: string } | null }> {
  const res = await getStudentBucketsAdmin({
    userEmail,
    module: MODULE4_NUMBER,
  });

  if (res.error) {
    return { data: null, error: res.error };
  }

  return { data: res.data ?? null, error: null };
}

export async function upsertModule4ParagraphPlansAdmin({
  userEmail,
  buckets,
  reflection,
  flow_state,
}: {
  userEmail: string;
  buckets: unknown;
  reflection?: string | null;
  flow_state?: StudentBucketFlowState | null;
}) {
  return upsertStudentBucketsAdmin({
    userEmail,
    module: MODULE4_NUMBER,
    buckets,
    reflection: reflection ?? null,
    flow_state: flow_state ?? null,
  });
}

export type { StudentBucketFlowState };
