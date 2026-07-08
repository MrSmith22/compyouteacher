import {
  getStudentBuckets,
  getStudentBucketsAdmin,
  upsertStudentBuckets,
  upsertStudentBucketsAdmin,
} from "@/lib/supabase/helpers/studentBuckets";
import { MODULE3_NUMBER } from "@/lib/supabase/helpers/module3Constants";

async function upsertModule3BucketsColumnInternal({
  userEmail,
  buckets,
  useAdmin,
}: {
  userEmail: string;
  buckets: unknown;
  useAdmin: boolean;
}) {
  const getBuckets = useAdmin ? getStudentBucketsAdmin : getStudentBuckets;
  const upsertBuckets = useAdmin ? upsertStudentBucketsAdmin : upsertStudentBuckets;

  const existingRes = await getBuckets({ userEmail, module: MODULE3_NUMBER });
  if (existingRes.error) return existingRes;
  const existing = existingRes.data ?? null;

  return upsertBuckets({
    userEmail,
    module: MODULE3_NUMBER,
    buckets,
    reflection: existing?.reflection ?? null,
    flow_state: existing?.flow_state ?? null,
  });
}

export async function upsertModule3BucketsColumnAdmin({
  userEmail,
  buckets,
}: {
  userEmail: string;
  buckets: unknown;
}) {
  return upsertModule3BucketsColumnInternal({ userEmail, buckets, useAdmin: true });
}

export async function upsertModule3BucketsColumnClient({
  userEmail,
  buckets,
}: {
  userEmail: string;
  buckets: unknown;
}) {
  return upsertModule3BucketsColumnInternal({ userEmail, buckets, useAdmin: false });
}
