import { getTChartEntriesAdmin } from "@/lib/supabase/helpers/tchartEntries";

export async function listTChartEntriesForUser(userEmail: string) {
  const res = await getTChartEntriesAdmin({ userEmail });

  if (res.error) {
    return {
      ok: false as const,
      error: res.error,
      data: [] as unknown[],
    };
  }

  return { ok: true as const, data: res.data ?? [] };
}
