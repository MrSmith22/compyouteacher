import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";
import {
  getStudentBucketsAdmin,
  upsertStudentBucketsAdmin,
} from "@/lib/supabase/helpers/studentBuckets";
import { MODULE3_NUMBER } from "@/lib/supabase/helpers/module3Constants";

export async function getModule3StudentBucketAdmin({ userEmail }: { userEmail: string }) {
  return getStudentBucketsAdmin({ userEmail, module: MODULE3_NUMBER });
}

export async function upsertModule3ScalarFlowStateAdmin<
  Key extends keyof StudentBucketFlowState,
>({
  userEmail,
  key,
  value,
}: {
  userEmail: string;
  key: Key;
  value: StudentBucketFlowState[Key] | null;
}) {
  const existingRes = await getModule3StudentBucketAdmin({ userEmail });
  if (existingRes.error) return { data: null, error: existingRes.error };
  const existing = existingRes.data ?? null;

  const existingFlowState = (existing?.flow_state ?? null) as StudentBucketFlowState | null;
  const nextFlowState: StudentBucketFlowState = {
    ...(existingFlowState || {}),
    [key]: value,
  };

  if (value === null || value === undefined) {
    delete nextFlowState[key];
  }

  return upsertStudentBucketsAdmin({
    userEmail,
    module: MODULE3_NUMBER,
    buckets: existing?.buckets ?? [],
    reflection: existing?.reflection ?? null,
    flow_state: nextFlowState,
  });
}

export async function upsertModule3FlowStatePatchAdmin({
  userEmail,
  patch,
}: {
  userEmail: string;
  patch: Partial<StudentBucketFlowState>;
}) {
  const existingRes = await getModule3StudentBucketAdmin({ userEmail });
  if (existingRes.error) return { data: null, error: existingRes.error };
  const existing = existingRes.data ?? null;

  const existingFlowState = (existing?.flow_state ?? null) as StudentBucketFlowState | null;
  const nextFlowState: StudentBucketFlowState = {
    ...(existingFlowState || {}),
    ...patch,
  };

  return upsertStudentBucketsAdmin({
    userEmail,
    module: MODULE3_NUMBER,
    buckets: existing?.buckets ?? [],
    reflection: existing?.reflection ?? null,
    flow_state: nextFlowState,
  });
}
