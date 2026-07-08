import {
  deleteClaimForUser,
  getClaimForUser,
  upsertClaimForUser,
} from "@/lib/artifacts/claimServer";
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

    const result = await getClaimForUser(userEmail);
    if (!result.ok) return failedResultResponse(result);

    return okResponse({ claim: result.claim });
  } catch (err) {
    return serverErrorResponse("Module 3 claim read failed:", err);
  }
}

export async function POST(req) {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const body = await parseJsonBody(req);
    const workingClaim = parseOptionalStringField(body, "workingClaim");
    const supportRationale = parseOptionalStringField(body, "supportRationale");
    const clusterId = parseOptionalNullableRefId(body, "clusterId");
    const patternId = parseOptionalNullableRefId(body, "patternId");

    const result = await upsertClaimForUser({
      userEmail,
      workingClaim,
      supportRationale,
      clusterId,
      patternId,
    });

    if (!result.ok) return failedResultResponse(result);

    return okResponse({ claim: result.claim ?? null });
  } catch (err) {
    return serverErrorResponse("Module 3 claim save failed:", err);
  }
}

export async function DELETE() {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const result = await deleteClaimForUser({ userEmail });
    if (!result.ok) return failedResultResponse(result);

    return okResponse();
  } catch (err) {
    return serverErrorResponse("Module 3 claim delete failed:", err);
  }
}
