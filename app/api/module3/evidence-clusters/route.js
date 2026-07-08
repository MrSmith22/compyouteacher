import {
  deleteEvidenceClusterForUser,
  listEvidenceClustersForUser,
  upsertEvidenceClusterForUser,
} from "@/lib/artifacts/evidenceClusterServer";
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

    const result = await listEvidenceClustersForUser(userEmail);
    if (!result.ok) return failedResultResponse(result);

    return okResponse({ clusters: result.clusters });
  } catch (err) {
    return serverErrorResponse("Module 3 evidence cluster list failed:", err);
  }
}

export async function POST(req) {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const body = await parseJsonBody(req);
    const id = parseRequiredTrimmedString(body, "id");
    const clusterName = parseRequiredTrimmedString(body, "clusterName");
    const evidenceIds = Array.isArray(body?.evidenceIds) ? body.evidenceIds : [];
    const reflection =
      typeof body?.reflection === "string" ? body.reflection.trim() || null : null;
    const assignmentId =
      typeof body?.assignmentId === "string" ? body.assignmentId : undefined;

    if (!id || !clusterName) {
      return NextResponse.json(
        { ok: false, error: "Missing cluster id or name" },
        { status: 400 }
      );
    }

    const result = await upsertEvidenceClusterForUser({
      id,
      userEmail,
      clusterName,
      reflection,
      evidenceIds,
      assignmentId,
    });

    if (!result.ok) return failedResultResponse(result);

    return okResponse();
  } catch (err) {
    return serverErrorResponse("Module 3 evidence cluster save failed:", err);
  }
}

export async function DELETE(req) {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) return unauthorizedResponse();

    const body = await parseJsonBody(req);
    const clusterId = parseRequiredTrimmedString(body, "clusterId");

    if (!clusterId) {
      return NextResponse.json(
        { ok: false, error: "Missing cluster id" },
        { status: 400 }
      );
    }

    const result = await deleteEvidenceClusterForUser({ userEmail, clusterId });
    if (!result.ok) return failedResultResponse(result);

    return okResponse();
  } catch (err) {
    return serverErrorResponse("Module 3 evidence cluster delete failed:", err);
  }
}
