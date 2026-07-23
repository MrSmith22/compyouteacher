import { NextResponse } from "next/server";
import {
  getAuthenticatedUserEmail,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/module3Routes";
import {
  getModule3StudentBucketAdmin,
  upsertModule3FlowStatePatchAdmin,
} from "@/lib/supabase/helpers/module3FlowState";
import { upsertThesisForUser } from "@/lib/artifacts/thesisServer";
import {
  assembleModule4HandoffFromSlice,
  createEmptyEvidenceArgumentSliceState,
  normalizeEvidenceArgumentSliceState,
} from "@/lib/artifacts/evidenceArgumentContract";
import { getAssignmentEvidenceArgumentRollout } from "@/lib/supabase/helpers/evidenceArgumentRolloutSettings";
import { setEvidenceArgumentModeCache } from "@/lib/assignments/evidenceArgumentModeCache";
import { isRebuiltEvidenceArgument } from "@/lib/assignments/evidenceArgumentRollout";
import { DEFAULT_ASSIGNMENT_ID } from "@/lib/assignments/identity";

async function assertEvidenceArgumentSliceAvailable() {
  const rollout = await getAssignmentEvidenceArgumentRollout(DEFAULT_ASSIGNMENT_ID);
  const envOverrideRaw = process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
  const hasOpsOverride =
    typeof envOverrideRaw === "string" &&
    ["legacy", "rebuilt"].includes(envOverrideRaw.trim().toLowerCase());

  // Development DX before migration: keep the accepted rebuilt path available
  // when the column is not yet present. Production requires schema or override.
  let mode = rollout.mode;
  if (
    !rollout.schemaOk &&
    !hasOpsOverride &&
    process.env.NODE_ENV === "development"
  ) {
    mode = "rebuilt";
  }
  setEvidenceArgumentModeCache(mode);

  if (!isRebuiltEvidenceArgument(mode)) {
    return {
      available: false as const,
      status: 404,
      error: "not_available",
    };
  }

  if (!rollout.schemaOk && !hasOpsOverride && process.env.NODE_ENV !== "development") {
    return {
      available: false as const,
      status: 503,
      error: "schema_missing",
      warning: rollout.warning || null,
    };
  }

  if (!rollout.schemaOk && hasOpsOverride) {
    console.warn("[wp088-rollout] schema_missing with ops override; proceeding", {
      assignmentId: DEFAULT_ASSIGNMENT_ID,
      mode,
      // no student prose
    });
  }

  return { available: true as const };
}

export async function GET() {
  try {
    const gate = await assertEvidenceArgumentSliceAvailable();
    if (!gate.available) {
      return NextResponse.json(
        { ok: false, error: gate.error, warning: gate.warning || null },
        { status: gate.status }
      );
    }
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const res = await getModule3StudentBucketAdmin({ userEmail });
    if (res.error) {
      return NextResponse.json(
        { ok: false, error: res.error.message },
        { status: 500 }
      );
    }
    const flow = (res.data?.flow_state || {}) as Record<string, unknown>;
    const rawSlice =
      flow.evidenceArgumentSlice && typeof flow.evidenceArgumentSlice === "object"
        ? flow.evidenceArgumentSlice
        : createEmptyEvidenceArgumentSliceState();
    const slice = normalizeEvidenceArgumentSliceState(rawSlice);

    return okResponse({ slice, flowState: flow });
  } catch (err) {
    return serverErrorResponse("WP-088 slice read failed:", err);
  }
}

export async function POST(req: Request) {
  try {
    const gate = await assertEvidenceArgumentSliceAvailable();
    if (!gate.available) {
      return NextResponse.json(
        { ok: false, error: gate.error, warning: gate.warning || null },
        { status: gate.status }
      );
    }
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const body = await req.json().catch(() => ({}));
    const rawSlice =
      body?.slice && typeof body.slice === "object"
        ? body.slice
        : createEmptyEvidenceArgumentSliceState();
    const slice = normalizeEvidenceArgumentSliceState(rawSlice, {
      optionId: (rawSlice as { directionDescriptor?: { optionId?: string } })
        ?.directionDescriptor?.optionId,
      customMapping: (rawSlice as { customMapping?: unknown })?.customMapping,
    });

    const patchRes = await upsertModule3FlowStatePatchAdmin({
      userEmail,
      patch: { evidenceArgumentSlice: slice } as never,
    });
    if (patchRes.error) {
      return NextResponse.json(
        { ok: false, error: patchRes.error.message },
        { status: 500 }
      );
    }

    if (body?.syncThesis) {
      const handoff = assembleModule4HandoffFromSlice(slice);
      const patternText = String(slice?.patternText || "").trim();
      let patternId = body.patternId || null;
      if (!patternId && patternText) {
        const { randomUUID } = await import("node:crypto");
        patternId = `ea-pattern-${randomUUID()}`;
        const evidenceIds = [
          handoff.speechEvidenceId,
          handoff.letterEvidenceId,
        ].filter(Boolean) as string[];
        const { upsertPatternForUser } = await import(
          "@/lib/artifacts/patternServer"
        );
        await upsertPatternForUser({
          id: patternId,
          userEmail,
          text: patternText,
          evidenceIds,
          isSelected: true,
          ...(body?.matrixProvenance
            ? { matrixProvenance: body.matrixProvenance }
            : {}),
        });
      }
      await upsertThesisForUser({
        userEmail,
        thesis: handoff.thesis,
        proofPlan: handoff.proofPlan,
        patternId,
        clusterId: body.clusterId || null,
        ...(body?.matrixProvenance
          ? { matrixProvenance: body.matrixProvenance }
          : {}),
      });
    }

    return okResponse({ slice });
  } catch (err) {
    return serverErrorResponse("WP-088 slice save failed:", err);
  }
}
