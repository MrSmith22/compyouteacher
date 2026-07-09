import type { Module6DraftRow } from "@/lib/supabase/helpers/module6Draft";
import {
  getModule6DraftAdmin,
  upsertModule6DraftAdmin,
} from "@/lib/supabase/helpers/module6Draft";

export type Module6DraftWriteInput = {
  userEmail: string;
  sections: string[];
  full_text: string;
  locked: boolean;
};

export async function getModule6DraftForUser(userEmail: string) {
  const res = await getModule6DraftAdmin({ userEmail });

  if (res.error) {
    return {
      ok: false as const,
      error: res.error,
      data: null as Module6DraftRow | null,
    };
  }

  return { ok: true as const, data: res.data };
}

export async function upsertModule6DraftForUser(input: Module6DraftWriteInput) {
  const writeRes = await upsertModule6DraftAdmin({
    userEmail: input.userEmail,
    sections: input.sections,
    full_text: input.full_text,
    locked: input.locked,
  });

  if (writeRes.error) {
    return { ok: false as const, error: writeRes.error };
  }

  return { ok: true as const };
}
