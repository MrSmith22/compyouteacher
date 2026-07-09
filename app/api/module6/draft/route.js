import { NextResponse } from "next/server";
import {
  getModule6DraftForUser,
  upsertModule6DraftForUser,
} from "@/lib/artifacts/draftServer";
import { parseJsonBody } from "@/lib/api/bodyParsers";
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
    const sections = body?.sections;

    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid sections array" },
        { status: 400 }
      );
    }

    const full_text =
      typeof body?.full_text === "string" ? body.full_text : sections.join("\n\n");
    const locked = body?.locked === true;

    const result = await upsertModule6DraftForUser({
      userEmail,
      sections,
      full_text,
      locked,
    });

    if (!result.ok) return failedResultResponse(result);

    return okResponse();
  } catch (err) {
    return serverErrorResponse("Module 6 draft save failed:", err);
  }
}
