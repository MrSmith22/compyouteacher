// app/api/outlines/route.js

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  getStudentOutline,
  upsertStudentOutline,
} from "@/lib/supabase/helpers/studentOutlines";
import {
  buildOutlineUpsertRow,
  resolveFinalizedWriteValue,
} from "@/lib/module5/outlinePersistenceHelpers";

// GET /api/outlines?module=5
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Not signed in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const moduleParam = searchParams.get("module");
    const moduleNumber = Number(moduleParam);

    if (!moduleParam || Number.isNaN(moduleNumber) || moduleNumber <= 0) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid module" },
        { status: 400 }
      );
    }

    const { data, error } = await getStudentOutline({
      userEmail: email,
      module: moduleNumber,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // data may be null if no outline exists yet; finalized may be null/absent on legacy rows
    return NextResponse.json({ ok: true, data: data ?? null }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

// POST /api/outlines  body: { module: 5, outline: {...}, finalized?: boolean }
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Not signed in" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const moduleRaw = body?.module;
    const outline = body?.outline;

    const moduleNumber = Number(moduleRaw);

    if (!moduleRaw || Number.isNaN(moduleNumber) || moduleNumber <= 0 || !outline) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const finalizedResolution = resolveFinalizedWriteValue(body?.finalized);
    const upsertArgs = {
      userEmail: email,
      module: moduleNumber,
      outline,
    };
    if (finalizedResolution.include) {
      upsertArgs.finalized = finalizedResolution.value;
    }

    const { error } = await upsertStudentOutline(upsertArgs);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const wrote = buildOutlineUpsertRow({
      userEmail: email,
      module: moduleNumber,
      outline,
      finalized: finalizedResolution.include
        ? finalizedResolution.value
        : undefined,
    });

    return NextResponse.json(
      {
        ok: true,
        finalizedWritten: finalizedResolution.include
          ? finalizedResolution.value
          : null,
        finalizedPreserved: !finalizedResolution.include,
        rowKeys: Object.keys(wrote),
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
