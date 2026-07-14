import {
  deleteIdeaForUser,
  getIdeaForUser,
  upsertIdeaForUser,
} from "@/lib/artifacts/ideaServer";
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

    const result = await getIdeaForUser(userEmail);
    if (!result.ok) return failedResultResponse(result);

    return okResponse({ idea: result.idea });
  } catch (err) {
    return serverErrorResponse("Module 3 idea list failed:", err);
  }
}

export async function POST(req) {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const body = await parseJsonBody(req);
    const statement = parseOptionalStringField(body, "statement");
    const whyMatters = parseOptionalStringField(body, "whyMatters");
    const clusterId = parseOptionalNullableRefId(body, "clusterId");
    const patternId = parseOptionalNullableRefId(body, "patternId");
    const evidenceMap =
      body?.evidenceMap === null
        ? null
        : typeof body?.evidenceMap === "object" && body.evidenceMap !== null
          ? body.evidenceMap
          : undefined;

    const result = await upsertIdeaForUser({
      userEmail,
      statement,
      whyMatters,
      clusterId,
      patternId,
      evidenceMap,
      ...(body?.matrixProvenance !== undefined
        ? { matrixProvenance: body.matrixProvenance }
        : {}),
      ...(body?.matrixReview !== undefined
        ? { matrixReview: body.matrixReview }
        : {}),
    });

    if (!result.ok) return failedResultResponse(result);

    return okResponse({ idea: result.idea ?? null });
  } catch (err) {
    return serverErrorResponse("Module 3 idea save failed:", err);
  }
}

export async function DELETE() {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const result = await deleteIdeaForUser({ userEmail });
    if (!result.ok) return failedResultResponse(result);

    return okResponse();
  } catch (err) {
    return serverErrorResponse("Module 3 idea delete failed:", err);
  }
}
