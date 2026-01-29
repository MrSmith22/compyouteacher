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

export type GateOk<
  TData extends Record<string, unknown> = Record<string, unknown>
> = {
  ok: true;
  data?: TData;
};

export type GateFail = {
  ok: false;
  reason: GateReason;
  message: string;
};

export type GateResult<
  TData extends Record<string, unknown> = Record<string, unknown>
> = GateOk<TData> | GateFail;

type CanEnterArgs = {
  userEmail?: string | null;
  targetModule: number;
};

type Module5OutlineRow = {
  outline: unknown;
  finalized: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOutline(raw: unknown): StudentOutline | null {
  if (!isRecord(raw)) return null;

  const rawBody = raw.body;
  if (!Array.isArray(rawBody)) return null;

  const body: OutlineBodyItem[] = rawBody
    .filter((b): b is Record<string, unknown> => isRecord(b))
    .map((b) => {
      const bucket = String(b.bucket ?? "").trim();

      const pointsRaw = b.points;
      const points = Array.isArray(pointsRaw)
        ? pointsRaw.map((p) => String(p))
        : [];

      return { bucket, points };
    })
    .filter((b) => b.bucket.length > 0);

  if (body.length === 0) return null;

  const out: StudentOutline = { body };

  if (typeof raw.thesis === "string") out.thesis = raw.thesis;

  return out;
}

async function getModule5OutlineRow(userEmail: string): Promise<Module5OutlineRow | null> {
  const { data, error } = await supabase
    .from("student_outlines")
    .select("outline,finalized")
    .eq("user_email", userEmail)
    .eq("module", 5)
    .single();

  if (error && (error as { code?: string }).code !== "PGRST116") throw error;

  if (!data) return null;

  const row = data as unknown;
  if (!isRecord(row)) return null;

  return {
    outline: row.outline,
    finalized: Boolean(row.finalized),
  };
}

async function getDraftLocked(userEmail: string, moduleNumber: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("student_drafts")
    .select("locked")
    .eq("user_email", userEmail)
    .eq("module", moduleNumber)
    .single();

  if (error && (error as { code?: string }).code !== "PGRST116") throw error;

  const row = data as unknown;
  if (!isRecord(row)) return false;

  return row.locked === true;
}

export async function canEnterModule<
  TData extends Record<string, unknown> = Record<string, unknown>
>(args: CanEnterArgs): Promise<GateResult<TData>> {
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