import { NextResponse } from "next/server";
import {
  getParagraphPlansForUser,
  upsertParagraphPlansForUser,
} from "@/lib/artifacts/paragraphPlanServer";
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

    const result = await getParagraphPlansForUser(userEmail);
    if (!result.ok) return failedResultResponse(result);

    return okResponse({ data: result.data });
  } catch (err) {
    return serverErrorResponse("Module 4 paragraph plans read failed:", err);
  }
}

export async function POST(req) {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const body = await parseJsonBody(req);
    const buckets = body?.buckets;

    if (!Array.isArray(buckets)) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid buckets array" },
        { status: 400 }
      );
    }

    const result = await upsertParagraphPlansForUser({
      userEmail,
      buckets,
      reflection: typeof body?.reflection === "string" ? body.reflection : undefined,
      flow_state: body?.flow_state ?? null,
    });

    if (!result.ok) return failedResultResponse(result);

    return okResponse();
  } catch (err) {
    return serverErrorResponse("Module 4 paragraph plans save failed:", err);
  }
}
