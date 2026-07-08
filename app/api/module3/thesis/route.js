import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  deleteThesisForUser,
  getThesisForUser,
  upsertThesisForUser,
} from "@/lib/artifacts/thesisServer";

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

    const result = await getThesisForUser(userEmail);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, thesis: result.thesis }, { status: 200 });
  } catch (err) {
    console.error("Module 3 thesis read failed:", err);
    return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 500 });
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
    const thesis = typeof body?.thesis === "string" ? body.thesis : undefined;
    const proofPlan = Array.isArray(body?.proofPlan) ? body.proofPlan : undefined;
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

    const result = await upsertThesisForUser({
      userEmail,
      thesis,
      proofPlan,
      clusterId,
      patternId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, thesis: result.thesis ?? null }, { status: 200 });
  } catch (err) {
    console.error("Module 3 thesis save failed:", err);
    return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }

    const result = await deleteThesisForUser({ userEmail });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Module 3 thesis delete failed:", err);
    return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 500 });
  }
}

