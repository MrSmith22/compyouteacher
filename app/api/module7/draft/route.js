import {
  getModule7DraftForUser,
  upsertModule7DraftForUser,
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

    const result = await getModule7DraftForUser(userEmail);
    if (!result.ok) return failedResultResponse(result);

    return okResponse({ data: result.data });
  } catch (err) {
    return serverErrorResponse("Module 7 draft read failed:", err);
  }
}

export async function POST(req) {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const body = await parseJsonBody(req);
    const full_text = typeof body?.full_text === "string" ? body.full_text : "";
    const final_text =
      body?.final_text === null || typeof body?.final_text === "string"
        ? body.final_text
        : null;
    const revised = body?.revised === true;
    const final_ready = body?.final_ready === true;

    const result = await upsertModule7DraftForUser({
      userEmail,
      full_text,
      final_text,
      revised,
      final_ready,
    });

    if (!result.ok) return failedResultResponse(result);

    return okResponse();
  } catch (err) {
    return serverErrorResponse("Module 7 draft save failed:", err);
  }
}
