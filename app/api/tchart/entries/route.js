import { listTChartEntriesForUser } from "@/lib/artifacts/tchartEntriesServer";
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

    const result = await listTChartEntriesForUser(userEmail);
    if (!result.ok) return failedResultResponse(result);

    return okResponse({ data: result.data });
  } catch (err) {
    return serverErrorResponse("T-chart entries read failed:", err);
  }
}
