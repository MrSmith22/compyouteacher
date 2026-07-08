import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  deleteEvidenceClusterForUser,
  listEvidenceClustersForUser,
  upsertEvidenceClusterForUser,
} from "@/lib/artifacts/evidenceClusterServer";

function errorMessage(error) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message || "Request failed");
  }
  return "Request failed";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { ok: false, error: "Not signed in" },
        { status: 401 }
      );
    }

    const result = await listEvidenceClustersForUser(userEmail);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, clusters: result.clusters }, { status: 200 });
  } catch (err) {
    console.error("Module 3 evidence cluster list failed:", err);
    return NextResponse.json(
      { ok: false, error: errorMessage(err) },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { ok: false, error: "Not signed in" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const clusterName =
      typeof body?.clusterName === "string" ? body.clusterName.trim() : "";
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

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Module 3 evidence cluster save failed:", err);
    return NextResponse.json(
      { ok: false, error: errorMessage(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { ok: false, error: "Not signed in" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const clusterId = typeof body?.clusterId === "string" ? body.clusterId.trim() : "";

    if (!clusterId) {
      return NextResponse.json(
        { ok: false, error: "Missing cluster id" },
        { status: 400 }
      );
    }

    const result = await deleteEvidenceClusterForUser({ userEmail, clusterId });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Module 3 evidence cluster delete failed:", err);
    return NextResponse.json(
      { ok: false, error: errorMessage(err) },
      { status: 500 }
    );
  }
}
