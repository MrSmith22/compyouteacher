import type { Module6DraftRow } from "@/lib/supabase/helpers/module6Draft";
import type { Module7DraftRow } from "@/lib/supabase/helpers/module7Draft";
import {
  getModule6DraftAdmin,
  upsertModule6DraftAdmin,
} from "@/lib/supabase/helpers/module6Draft";
import {
  getModule7DraftAdmin,
  upsertModule7DraftAdmin,
} from "@/lib/supabase/helpers/module7Draft";

export type Module6DraftWriteInput = {
  userEmail: string;
  sections: string[];
  full_text: string;
  locked: boolean;
};

export type Module7DraftWriteInput = {
  userEmail: string;
  full_text: string;
  final_text: string | null;
  revised: boolean;
  final_ready: boolean;
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

export async function getModule7DraftForUser(userEmail: string) {
  const res = await getModule7DraftAdmin({ userEmail });

  if (res.error) {
    return {
      ok: false as const,
      error: res.error,
      data: null as Module7DraftRow | null,
    };
  }

  return { ok: true as const, data: res.data };
}

export async function upsertModule7DraftForUser(input: Module7DraftWriteInput) {
  const writeRes = await upsertModule7DraftAdmin({
    userEmail: input.userEmail,
    full_text: input.full_text,
    final_text: input.final_text,
    revised: input.revised,
    final_ready: input.final_ready,
  });

  if (writeRes.error) {
    return { ok: false as const, error: writeRes.error };
  }

  return { ok: true as const };
}
