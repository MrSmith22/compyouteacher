import { errorMessage } from "@/lib/api/errors";
import { parseApiResponse } from "@/lib/api/clientFetch";
import type { Module6DraftRow } from "@/lib/supabase/helpers/module6Draft";
import type { Module7DraftRow } from "@/lib/supabase/helpers/module7Draft";
import type { StudentBucketsRow } from "@/lib/supabase/helpers/studentBuckets";

const PARAGRAPH_PLAN_API_PATH = "/api/module4/buckets";
const OUTLINE_API_PATH = "/api/outlines";
const MODULE6_DRAFT_API_PATH = "/api/module6/draft";
const MODULE7_DRAFT_API_PATH = "/api/module7/draft";
const TCHART_ENTRIES_API_PATH = "/api/tchart/entries";

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

export async function getOutlineRow(module = 5) {
  const res = await fetch(`${OUTLINE_API_PATH}?module=${module}`);

  try {
    const json = await parseApiResponse(res);
    return {
      ok: true as const,
      data: json.data ?? null,
    };
  } catch (error) {
    return {
      ok: false as const,
      error: { message: errorMessage(error) },
      data: null,
    };
  }
}

export async function getModule6DraftRow() {
  const res = await fetch(MODULE6_DRAFT_API_PATH);

  try {
    const json = await parseApiResponse(res);
    return {
      ok: true as const,
      data: (json.data ?? null) as Module6DraftRow | null,
    };
  } catch (error) {
    return {
      ok: false as const,
      error: { message: errorMessage(error) },
      data: null as Module6DraftRow | null,
    };
  }
}

export async function getModule7DraftRow() {
  const res = await fetch(MODULE7_DRAFT_API_PATH);

  try {
    const json = await parseApiResponse(res);
    return {
      ok: true as const,
      data: (json.data ?? null) as Module7DraftRow | null,
    };
  } catch (error) {
    return {
      ok: false as const,
      error: { message: errorMessage(error) },
      data: null as Module7DraftRow | null,
    };
  }
}

export async function getTChartEntriesRows() {
  const res = await fetch(TCHART_ENTRIES_API_PATH);

  try {
    const json = await parseApiResponse(res);
    return {
      ok: true as const,
      data: Array.isArray(json.data) ? json.data : [],
    };
  } catch (error) {
    return {
      ok: false as const,
      error: { message: errorMessage(error) },
      data: [] as unknown[],
    };
  }
}
