import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client connection (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    // 1) Require a signed-in user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Not signed in" },
        { status: 401 }
      );
    }

    const user_email = session.user.email;

    // 2) Read the payload from the client
    const payload = await req.json();
    const entries = payload?.entries;
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No entries provided" },
        { status: 400 }
      );
    }

    // 3) Normalize & add audit fields
    const now = new Date().toISOString();
    const rows = entries.map((e) => ({
      user_email,
      category: e.category,          // "ethos" | "pathos" | "logos"
      type: e.type,                  // "speech" | "letter"
      quote: e.quote || "",
      observation: e.observation || "",
      letter_url: e.letter_url || null, // only present for "letter"
      updated_at: now,
    }));

    // 4) UPSERT instead of INSERT
    //    Uses the unique index (user_email, category, type)
    const { data, error } = await supabase
      .from("tchart_entries")
      .upsert(rows, {
        onConflict: "user_email,category,type",
        ignoreDuplicates: false,
      })
      .select(); // optional: return rows for debugging

    if (error) throw error;

    return NextResponse.json({ ok: true, count: data?.length ?? 0 });
  } catch (err) {
    console.error("Save T-Chart failed:", err);
    return NextResponse.json(
      { ok: false, error: String(err.message || err) },
      { status: 500 }
    );
  }
}