import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  deleteIdeaForUser,
  getIdeaForUser,
  upsertIdeaForUser,
} from "@/lib/artifacts/ideaServer";

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

    const result = await getIdeaForUser(userEmail);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, idea: result.idea }, { status: 200 });
  } catch (err) {
    console.error("Module 3 idea list failed:", err);
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
    const statement = typeof body?.statement === "string" ? body.statement : "";
    const whyMatters = typeof body?.whyMatters === "string" ? body.whyMatters : "";
    const clusterId =
      typeof body?.clusterId === "string" ? body.clusterId.trim() || null : null;
    const patternId =
      typeof body?.patternId === "string" ? body.patternId.trim() || null : null;

    const result = await upsertIdeaForUser({
      userEmail,
      statement,
      whyMatters,
      clusterId,
      patternId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, idea: result.idea ?? null }, { status: 200 });
  } catch (err) {
    console.error("Module 3 idea save failed:", err);
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

    const result = await deleteIdeaForUser({ userEmail });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Module 3 idea delete failed:", err);
    return NextResponse.json(
      { ok: false, error: errorMessage(err) },
      { status: 500 }
    );
  }
}
