import { supabase } from "@/lib/supabaseClient";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type StudentBucketFlowState = {
  v?: number;
  step?: number;
  wantThirdBucket?: boolean | null;
  patternChoice?: string;
  module3Patterns?: unknown;
  module3SelectedPatternId?: string | null;
  module3Idea?: unknown;
  module3Claim?: unknown;
};

export type StudentBucketsRow = {
  user_email: string;
  module: number;
  buckets: unknown;
  reflection: string | null;
  flow_state: StudentBucketFlowState | null;
  updated_at?: string;
};

export async function getStudentBuckets({
  userEmail,
  module: moduleNumber,
}: {
  userEmail: string;
  module: number;
}) {
  return supabase
    .from("student_buckets")
    .select("*")
    .eq("user_email", userEmail)
    .eq("module", moduleNumber)
    .maybeSingle();
}

/** Same projection as {@link getStudentBuckets}; uses the service role for server-side loads. */
export async function getStudentBucketsAdmin({
  userEmail,
  module: moduleNumber,
}: {
  userEmail: string;
  module: number;
}) {
  return getSupabaseAdmin()
    .from("student_buckets")
    .select("*")
    .eq("user_email", userEmail)
    .eq("module", moduleNumber)
    .maybeSingle();
}

export async function upsertStudentBuckets({
  userEmail,
  module: moduleNumber,
  buckets,
  reflection,
  flow_state,
}: {
  userEmail: string;
  module: number;
  buckets: unknown;
  reflection?: string | null;
  flow_state?: StudentBucketFlowState | null;
}) {
  return supabase.from("student_buckets").upsert(
    {
      user_email: userEmail,
      module: moduleNumber,
      buckets,
      reflection: reflection ?? null,
      flow_state: flow_state ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_email,module" }
  );
}

/** Same write as {@link upsertStudentBuckets}; uses the service role for server-side routes. */
export async function upsertStudentBucketsAdmin({
  userEmail,
  module: moduleNumber,
  buckets,
  reflection,
  flow_state,
}: {
  userEmail: string;
  module: number;
  buckets: unknown;
  reflection?: string | null;
  flow_state?: StudentBucketFlowState | null;
}) {
  return getSupabaseAdmin().from("student_buckets").upsert(
    {
      user_email: userEmail,
      module: moduleNumber,
      buckets,
      reflection: reflection ?? null,
      flow_state: flow_state ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_email,module" }
  );
}
