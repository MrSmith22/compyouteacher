// lib/progression/guards.ts
import { supabase } from "@/lib/supabaseClient";

export type OutlineBodyItem = {
  bucket: string;
  points: string[];
};

export type StudentOutline = {
  body: OutlineBodyItem[];
  thesis?: string;
};

export type GateReason =
  | "unknown"
  | "not_signed_in"
  | "module_5_not_finalized"
  | "outline_missing"
  | "module_6_not_locked";

export type GateOk<TData extends Record<string, unknown> = Record<string, unknown>> = {
  ok: true;
  data?: TData;
};

export type GateFail = {
  ok: false;
  reason: GateReason;
  message: string;
};

export type GateResult<TData extends Record<string, unknown> = Record<string, unknown>> =
  | GateOk<TData>
  | GateFail;

type CanEnterArgs = {
  userEmail?: string | null;
  targetModule: number;
};

function normalizeOutline(raw: any): StudentOutline | null {
  if (!raw || typeof raw !== "object") return null;
  if (!Array.isArray(raw.body)) return null;

  const body: OutlineBodyItem[] = raw.body
    .filter((b: any) => b && typeof b === "object")
    .map((b: any) => ({
      bucket: String(b.bucket ?? "").trim(),
      points: Array.isArray(b.points) ? b.points.map((p: any) => String(p)) : [],
    }))
    .filter((b: OutlineBodyItem) => b.bucket.length > 0);

  if (body.length === 0) return null;

  const out: StudentOutline = { body };

  if (typeof raw.thesis === "string") out.thesis = raw.thesis;

  return out;
}

async function getModule5OutlineRow(userEmail: string) {
  const { data, error } = await supabase
    .from("student_outlines")
    .select("outline,finalized")
    .eq("user_email", userEmail)
    .eq("module", 5)
    .single();

  if (error && (error as any).code !== "PGRST116") throw error;
  return data as { outline: any; finalized: boolean } | null;
}

async function getDraftLocked(userEmail: string, module: number) {
  const { data, error } = await supabase
    .from("student_drafts")
    .select("locked")
    .eq("user_email", userEmail)
    .eq("module", module)
    .single();

  if (error && (error as any).code !== "PGRST116") throw error;
  return (data?.locked as boolean) ?? false;
}

export async function canEnterModule<TData extends Record<string, unknown> = Record<string, unknown>>(
  args: CanEnterArgs
): Promise<GateResult<TData>> {
  const { userEmail, targetModule } = args;

  if (!userEmail) {
    return {
      ok: false,
      reason: "not_signed_in",
      message: "You must be signed in to access this module.",
    };
  }

  try {
    // Module 6 requires finalized Module 5 outline and returns it
    if (targetModule === 6) {
      const row = await getModule5OutlineRow(userEmail);

      if (!row?.finalized) {
        return {
          ok: false,
          reason: "module_5_not_finalized",
          message: "You need to finish and finalize Module 5 before starting Module 6.",
        };
      }

      const outline = normalizeOutline(row.outline);

      if (!outline) {
        return {
          ok: false,
          reason: "outline_missing",
          message: "Could not load your outline data. Please try again.",
        };
      }

      return {
        ok: true,
        data: { outline } as unknown as TData,
      };
    }

    // Module 7 requires Module 6 draft locked
    if (targetModule === 7) {
      const locked = await getDraftLocked(userEmail, 6);

      if (!locked) {
        return {
          ok: false,
          reason: "module_6_not_locked",
          message: "You need to complete Module 6 before starting Module 7.",
        };
      }

      return { ok: true };
    }

    // Default allow
    return { ok: true };
  } catch (e) {
    console.error("canEnterModule error:", e);
    return {
      ok: false,
      reason: "unknown",
      message: "Something went wrong while checking access. Please try again.",
    };
  }
}