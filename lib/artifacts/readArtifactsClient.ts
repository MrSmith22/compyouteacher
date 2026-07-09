import { errorMessage } from "@/lib/api/errors";
import { parseApiResponse } from "@/lib/api/clientFetch";
import type { StudentBucketsRow } from "@/lib/supabase/helpers/studentBuckets";

const PARAGRAPH_PLAN_API_PATH = "/api/module4/buckets";

export async function getParagraphPlanRow() {
  const res = await fetch(PARAGRAPH_PLAN_API_PATH);

  try {
    const json = await parseApiResponse(res);
    return {
      ok: true as const,
      data: (json.data ?? null) as StudentBucketsRow | null,
    };
  } catch (error) {
    return {
      ok: false as const,
      error: { message: errorMessage(error) },
      data: null as StudentBucketsRow | null,
    };
  }
}
