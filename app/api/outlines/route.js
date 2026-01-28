// app/api/outlines/route.js

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  getStudentOutline,
  upsertStudentOutline,
} from "@/lib/supabase/helpers/studentOutlines";

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
    const module = Number(moduleParam);

    if (!moduleParam || Number.isNaN(module) || module <= 0) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid module" },
        { status: 400 }
      );
    }

    const { data, error } = await getStudentOutline({
      userEmail: email,
      module,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // data may be null if no outline exists yet
    return NextResponse.json({ ok: true, data: data ?? null }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

// POST /api/outlines  body: { module: 5, outline: {...}, finalized?: true }
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
    const { module, outline } = body;

    const moduleNum = Number(module);

    if (!module || Number.isNaN(moduleNum) || moduleNum <= 0 || !outline) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { error } = await upsertStudentOutline({
      userEmail: email,
      module: moduleNum,
      outline,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // IMPORTANT: ModuleFive expects json.ok in a few places
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}