import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { upsertTChartEntries } from "@/lib/supabase/helpers/tchartEntries";

export async function POST(req) {
  try {
    // Require a signed in user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Not signed in" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    // Read payload
    const payload = await req.json();
    const entries = payload?.entries;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No entries provided" },
        { status: 400 }
      );
    }

    const { data, error } = await upsertTChartEntries({
      userEmail,
      entries,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true, count: data?.length ?? 0 });
  } catch (err) {
    console.error("Save T Chart failed:", err);
    return NextResponse.json(
      { ok: false, error: String(err.message || err) },
      { status: 500 }
    );
  }
}