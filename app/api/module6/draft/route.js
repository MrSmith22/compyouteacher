import { NextResponse } from "next/server";
import {
  getModule6DraftForUser,
  writeModule6DraftAtomicForUser,
} from "@/lib/artifacts/draftServer";
import { parseJsonBody } from "@/lib/api/bodyParsers";
import {
  failedResultResponse,
  getAuthenticatedUserEmail,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/module3Routes";
import { MODULE6_WRITE_ACTION } from "@/lib/module6/draftPersistenceHelpers";
import { httpStatusForAtomicResult } from "@/lib/supabase/helpers/module6AtomicDraft";
import { loadFinalizedModule5Outline } from "@/lib/module6/module6FinalizeValidation";
import {
  validateModule6FinalizeRequestBody,
  validateModule6OrdinaryWriteBody,
} from "@/lib/module6/module6DraftWriteValidation";

export async function GET() {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const result = await getModule6DraftForUser(userEmail);
    if (!result.ok) return failedResultResponse(result);

    return okResponse({ data: result.data });
  } catch (err) {
    return serverErrorResponse("Module 6 draft read failed:", err);
  }
}

export async function POST(req) {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const body = await parseJsonBody(req);
    const action = String(body?.action || MODULE6_WRITE_ACTION.AUTOSAVE).toLowerCase();

    // Session email is authoritative — ignore any client-supplied email.

    if (action === MODULE6_WRITE_ACTION.FINALIZE) {
      const outlineLoad = await loadFinalizedModule5Outline(userEmail);
      if (!outlineLoad.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: outlineLoad.error,
            code: outlineLoad.code,
          },
          { status: outlineLoad.status || 422 }
        );
      }

      const finalizeValidation = validateModule6FinalizeRequestBody(body, {
        outline: outlineLoad.outline,
      });

      if (!finalizeValidation.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: finalizeValidation.error,
            code: finalizeValidation.code,
            reviewRequired: finalizeValidation.reviewRequired === true,
          },
          { status: finalizeValidation.status || 422 }
        );
      }

      const atomic = await writeModule6DraftAtomicForUser({
        userEmail,
        action: MODULE6_WRITE_ACTION.FINALIZE,
        sections: finalizeValidation.sections,
        draft_meta: finalizeValidation.draftMeta,
        expected_revision: finalizeValidation.expectedRevision,
      });

      if (!atomic.ok) {
        const status = atomic.httpStatus || 503;
        return NextResponse.json(
          {
            ok: false,
            error: atomic.error,
            code: atomic.code,
            status: atomic.status,
            locked: atomic.locked,
            revision: atomic.revision,
          },
          { status }
        );
      }

      if (atomic.result?.ok === false) {
        const status = httpStatusForAtomicResult(atomic.result);
        return NextResponse.json(
          {
            ok: false,
            error: atomic.result.error || "Finalize rejected",
            status: atomic.result.status,
            locked: atomic.result.locked,
            revision: atomic.result.revision,
          },
          { status }
        );
      }

      return okResponse({
        status: atomic.result?.status || "finalized",
        locked: true,
        revision: atomic.result?.revision,
        full_text: atomic.result?.full_text,
      });
    }

    const validated = validateModule6OrdinaryWriteBody(body);
    if (!validated.ok) {
      return NextResponse.json(
        { ok: false, error: validated.error, code: validated.code },
        { status: validated.status || 400 }
      );
    }

    const atomic = await writeModule6DraftAtomicForUser({
      userEmail,
      action: validated.action,
      sections: validated.sections,
      draft_meta: validated.draftMeta,
      expected_revision: validated.expectedRevision,
    });

    if (!atomic.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: atomic.error,
          code: atomic.code,
        },
        { status: atomic.httpStatus || 503 }
      );
    }

    if (atomic.result?.ok === false) {
      const status = httpStatusForAtomicResult(atomic.result);
      return NextResponse.json(
        {
          ok: false,
          error: atomic.result.error || "Write rejected",
          status: atomic.result.status,
          locked: atomic.result.locked,
          revision: atomic.result.revision,
        },
        { status }
      );
    }

    return okResponse({
      status: atomic.result?.status || "saved",
      locked: atomic.result?.locked ?? false,
      revision: atomic.result?.revision,
      full_text: atomic.result?.full_text,
    });
  } catch (err) {
    return serverErrorResponse("Module 6 draft save failed:", err);
  }
}
