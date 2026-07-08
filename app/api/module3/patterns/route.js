import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  deletePatternForUser,
  listPatternsForUser,
  selectPatternForUser,
  upsertPatternForUser,
} from "@/lib/artifacts/patternServer";

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

    const result = await listPatternsForUser(userEmail);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        patterns: result.patterns,
        selectedPatternId: result.selectedPatternId,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Module 3 pattern list failed:", err);
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
    const mode = typeof body?.mode === "string" ? body.mode : "upsert";

    if (mode === "select") {
      const patternId =
        typeof body?.patternId === "string" ? body.patternId.trim() : "";
      if (!patternId) {
        return NextResponse.json(
          { ok: false, error: "Missing pattern id" },
          { status: 400 }
        );
      }

      const result = await selectPatternForUser({ userEmail, patternId });
      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: errorMessage(result.error) },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const text = typeof body?.text === "string" ? body.text : "";
    const evidenceIds = Array.isArray(body?.evidenceIds) ? body.evidenceIds : [];
    const isSelected = Boolean(body?.isSelected);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing pattern id" },
        { status: 400 }
      );
    }

    const result = await upsertPatternForUser({
      id,
      userEmail,
      text,
      evidenceIds,
      isSelected,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Module 3 pattern save failed:", err);
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
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const patternId = typeof body?.patternId === "string" ? body.patternId.trim() : "";

    if (!patternId) {
      return NextResponse.json(
        { ok: false, error: "Missing pattern id" },
        { status: 400 }
      );
    }

    const result = await deletePatternForUser({ userEmail, patternId });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: errorMessage(result.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Module 3 pattern delete failed:", err);
    return NextResponse.json(
      { ok: false, error: errorMessage(err) },
      { status: 500 }
    );
  }
}

