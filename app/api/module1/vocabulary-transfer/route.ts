import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAssignmentVocabularyTransferRollout } from "@/lib/supabase/helpers/vocabularyTransferRolloutSettings";
import { setVocabularyTransferModeCache } from "@/lib/assignments/vocabularyTransferModeCache";
import { isRebuiltVocabularyTransfer } from "@/lib/assignments/vocabularyTransferRollout";
import { DEFAULT_ASSIGNMENT_ID } from "@/lib/assignments/identity";
import {
  getModule1VocabularyTransferState,
  upsertModule1VocabularyTransferState,
} from "@/lib/supabase/helpers/module1VocabularyTransfer";
import {
  normalizeVocabularyTransferState,
  resolveVocabularyTransferAuthority,
} from "@/lib/module1/vocabularyTransferState";

async function assertVocabularyTransferAvailable() {
  const rollout = await getAssignmentVocabularyTransferRollout(
    DEFAULT_ASSIGNMENT_ID
  );
  const envOverrideRaw = process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE;
  const hasOpsOverride =
    typeof envOverrideRaw === "string" &&
    ["legacy", "rebuilt"].includes(envOverrideRaw.trim().toLowerCase());

  let mode = rollout.mode;
  if (
    !rollout.schemaOk &&
    !hasOpsOverride &&
    process.env.NODE_ENV === "development"
  ) {
    mode = "rebuilt";
  }
  setVocabularyTransferModeCache(mode);

  if (!rollout.schemaOk && !hasOpsOverride && process.env.NODE_ENV !== "development") {
    return {
      available: false as const,
      status: 503,
      error: "schema_missing",
      warning: rollout.warning || null,
    };
  }

  if (!isRebuiltVocabularyTransfer(mode)) {
    return {
      available: false as const,
      status: 404,
      error: "not_available",
      mode,
    };
  }

  return { available: true as const, mode, rollout };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const gate = await assertVocabularyTransferAvailable();
  if (!gate.available) {
    return NextResponse.json(
      { ok: false, error: gate.error, warning: gate.warning || null },
      { status: gate.status }
    );
  }

  const result = await getModule1VocabularyTransferState(email);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, schemaOk: result.schemaOk ?? true },
      { status: result.status || 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    mode: gate.mode,
    exists: result.exists,
    vocabularyTransfer: result.vocabularyTransfer,
    updatedAt: result.updatedAt,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const gate = await assertVocabularyTransferAvailable();
  if (!gate.available) {
    return NextResponse.json(
      { ok: false, error: gate.error, warning: gate.warning || null },
      { status: gate.status }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const incoming = normalizeVocabularyTransferState(body.vocabularyTransfer);
  const existing = await getModule1VocabularyTransferState(email);
  if (!existing.ok) {
    return NextResponse.json(
      { ok: false, error: existing.error, schemaOk: existing.schemaOk ?? true },
      { status: existing.status || 500 }
    );
  }

  const force = body.force === true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let toSave: any = incoming;
  let needsReview = false;
  let mergeReason: string | null = null;

  if (existing.exists && existing.vocabularyTransfer && !force) {
    const resolved = resolveVocabularyTransferAuthority(
      existing.vocabularyTransfer,
      incoming
    );
    // Client save of newer work: if local (incoming) is richer, prefer it unless conflict needs review
    if (resolved.needsReview && !force) {
      needsReview = true;
      mergeReason = resolved.reason;
      toSave = normalizeVocabularyTransferState(resolved.state);
    } else if (
      resolved.reason === "prefer_more_complete_server" &&
      body.preferIncoming !== true
    ) {
      // Do not silently overwrite a richer server record
      return NextResponse.json({
        ok: true,
        preserved: true,
        vocabularyTransfer: existing.vocabularyTransfer,
        updatedAt: existing.updatedAt,
        reason: resolved.reason,
      });
    } else {
      toSave = incoming;
      mergeReason = resolved.reason;
    }
  }

  const saved = await upsertModule1VocabularyTransferState(email, toSave);
  if (!saved.ok) {
    return NextResponse.json(
      { ok: false, error: saved.error, schemaOk: saved.schemaOk ?? true },
      { status: saved.status || 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    vocabularyTransfer: saved.vocabularyTransfer,
    updatedAt: saved.updatedAt,
    needsReview,
    reason: mergeReason,
  });
}
