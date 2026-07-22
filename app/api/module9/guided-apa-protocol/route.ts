import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAssignmentSubmissionProtocolRollout } from "@/lib/supabase/helpers/submissionProtocolRolloutSettings";
import { setSubmissionProtocolModeCache } from "@/lib/assignments/submissionProtocolModeCache";
import { isRebuiltSubmissionProtocol } from "@/lib/assignments/submissionProtocolRollout";
import { DEFAULT_ASSIGNMENT_ID } from "@/lib/assignments/identity";
import {
  getModule9GuidedApaProtocolState,
  upsertModule9GuidedApaProtocolState,
} from "@/lib/supabase/helpers/module9GuidedApaProtocol";
import { normalizeGuidedApaProtocolState } from "@/lib/module9/guidedApaProtocolState";

async function assertGuidedApaProtocolAvailable() {
  const rollout = await getAssignmentSubmissionProtocolRollout(
    DEFAULT_ASSIGNMENT_ID
  );
  const envOverrideRaw = process.env.SUBMISSION_PROTOCOL_MODE_OVERRIDE;
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
  setSubmissionProtocolModeCache(mode);

  if (!rollout.schemaOk && !hasOpsOverride && process.env.NODE_ENV !== "development") {
    return {
      available: false as const,
      status: 503,
      error: "schema_missing",
      warning: rollout.warning || null,
    };
  }

  if (!isRebuiltSubmissionProtocol(mode)) {
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

  const gate = await assertGuidedApaProtocolAvailable();
  if (!gate.available) {
    return NextResponse.json(
      { ok: false, error: gate.error, warning: gate.warning || null },
      { status: gate.status }
    );
  }

  const result = await getModule9GuidedApaProtocolState(email);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, schemaOk: result.schemaOk ?? true },
      { status: result.status || 500 }
    );
  }
  return NextResponse.json({
    ok: true,
    exists: result.exists,
    state: result.state,
    updatedAt: result.updatedAt,
    mode: gate.mode,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const gate = await assertGuidedApaProtocolAvailable();
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
  const incoming = normalizeGuidedApaProtocolState(body.state);
  const saved = await upsertModule9GuidedApaProtocolState(email, incoming);
  if (!saved.ok) {
    return NextResponse.json(
      { ok: false, error: saved.error, schemaOk: saved.schemaOk ?? true },
      { status: saved.status || 500 }
    );
  }
  return NextResponse.json({
    ok: true,
    stale: Boolean(saved.stale),
    state: saved.state,
    updatedAt: saved.updatedAt,
    mode: gate.mode,
  });
}
