import {
  deleteThesisForUser,
  getThesisForUser,
  upsertThesisForUser,
} from "@/lib/artifacts/thesisServer";
import {
  parseJsonBody,
  parseOptionalNullableRefId,
  parseOptionalStringField,
} from "@/lib/api/bodyParsers";
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

    const result = await getThesisForUser(userEmail);
    if (!result.ok) return failedResultResponse(result);

    return okResponse({ thesis: result.thesis });
  } catch (err) {
    return serverErrorResponse("Module 3 thesis read failed:", err);
  }
}

export async function POST(req) {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const body = await parseJsonBody(req);
    const thesis = parseOptionalStringField(body, "thesis");
    const proofPlan = Array.isArray(body?.proofPlan) ? body.proofPlan : undefined;
    const clusterId = parseOptionalNullableRefId(body, "clusterId");
    const patternId = parseOptionalNullableRefId(body, "patternId");

    const result = await upsertThesisForUser({
      userEmail,
      thesis,
      proofPlan,
      clusterId,
      patternId,
    });

    if (!result.ok) return failedResultResponse(result);

    return okResponse({ thesis: result.thesis ?? null });
  } catch (err) {
    return serverErrorResponse("Module 3 thesis save failed:", err);
  }
}

export async function DELETE() {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const result = await deleteThesisForUser({ userEmail });
    if (!result.ok) return failedResultResponse(result);

    return okResponse();
  } catch (err) {
    return serverErrorResponse("Module 3 thesis delete failed:", err);
  }
}
