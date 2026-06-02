import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  getStudentBuckets,
  upsertStudentBuckets,
} from "@/lib/supabase/helpers/studentBuckets";

const MODULE_NUM = 4;

// GET /api/module4/buckets
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Not signed in" },
        { status: 401 }
      );
    }

    const { data, error } = await getStudentBuckets({
      userEmail: email,
      module: MODULE_NUM,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: data ?? null }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

// POST /api/module4/buckets  body: { buckets, reflection?, flow_state? }
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

    const body = await req.json().catch(() => ({}));
    const buckets = body?.buckets;

    if (!Array.isArray(buckets)) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid buckets array" },
        { status: 400 }
      );
    }

    const { error } = await upsertStudentBuckets({
      userEmail: email,
      module: MODULE_NUM,
      buckets,
      reflection: body?.reflection,
      flow_state: body?.flow_state ?? null,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
