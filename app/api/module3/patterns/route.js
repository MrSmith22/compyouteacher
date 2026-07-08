import {
  deletePatternForUser,
  listPatternsForUser,
  selectPatternForUser,
  upsertPatternForUser,
} from "@/lib/artifacts/patternServer";
import { NextResponse } from "next/server";
import { parseJsonBody, parseRequiredTrimmedString } from "@/lib/api/bodyParsers";
import {
  failedResultResponse,
  getAuthenticatedUserEmail,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/module3Routes";

export async function GET() {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const result = await listPatternsForUser(userEmail);
    if (!result.ok) return failedResultResponse(result);

    return okResponse({
      patterns: result.patterns,
      selectedPatternId: result.selectedPatternId,
    });
  } catch (err) {
    return serverErrorResponse("Module 3 pattern list failed:", err);
  }
}

export async function POST(req) {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const body = await parseJsonBody(req);
    const mode = typeof body?.mode === "string" ? body.mode : "upsert";

    if (mode === "select") {
      const patternId = parseRequiredTrimmedString(body, "patternId");
      if (!patternId) {
        return NextResponse.json(
          { ok: false, error: "Missing pattern id" },
          { status: 400 }
        );
      }

      const result = await selectPatternForUser({ userEmail, patternId });
      if (!result.ok) return failedResultResponse(result);

      return okResponse();
    }

    const id = parseRequiredTrimmedString(body, "id");
    const text = typeof body?.text === "string" ? body.text : "";
    const evidenceIds = Array.isArray(body?.evidenceIds) ? body.evidenceIds : [];
    const isSelected = Boolean(body?.isSelected);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing pattern id" },
        { status: 400 }
      );
    }

    const result = await upsertPatternForUser({
      id,
      userEmail,
      text,
      evidenceIds,
      isSelected,
    });

    if (!result.ok) return failedResultResponse(result);

    return okResponse();
  } catch (err) {
    return serverErrorResponse("Module 3 pattern save failed:", err);
  }
}

export async function DELETE(req) {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const body = await parseJsonBody(req);
    const patternId = parseRequiredTrimmedString(body, "patternId");

    if (!patternId) {
      return NextResponse.json(
        { ok: false, error: "Missing pattern id" },
        { status: 400 }
      );
    }

    const result = await deletePatternForUser({ userEmail, patternId });
    if (!result.ok) return failedResultResponse(result);

    return okResponse();
  } catch (err) {
    return serverErrorResponse("Module 3 pattern delete failed:", err);
  }
}
