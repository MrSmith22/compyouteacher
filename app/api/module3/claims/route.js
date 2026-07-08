import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  deleteClaimForUser,
  getClaimForUser,
  upsertClaimForUser,
} from "@/lib/artifacts/claimServer";

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
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }

    const result = await getClaimForUser(userEmail);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, claim: result.claim }, { status: 200 });
  } catch (err) {
    console.error("Module 3 claim read failed:", err);
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
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const workingClaim =
      typeof body?.workingClaim === "string" ? body.workingClaim : undefined;
    const supportRationale =
      typeof body?.supportRationale === "string" ? body.supportRationale : undefined;
    const clusterId =
      body?.clusterId === null
        ? null
        : typeof body?.clusterId === "string"
          ? body.clusterId.trim() || null
          : undefined;
    const patternId =
      body?.patternId === null
        ? null
        : typeof body?.patternId === "string"
          ? body.patternId.trim() || null
          : undefined;

    const result = await upsertClaimForUser({
      userEmail,
      workingClaim,
      supportRationale,
      clusterId,
      patternId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, claim: result.claim ?? null }, { status: 200 });
  } catch (err) {
    console.error("Module 3 claim save failed:", err);
    return NextResponse.json(
      { ok: false, error: errorMessage(err) },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }

    const result = await deleteClaimForUser({ userEmail });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Module 3 claim delete failed:", err);
    return NextResponse.json(
      { ok: false, error: errorMessage(err) },
      { status: 500 }
    );
  }
}
