import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { createClient } from "@supabase/supabase-js";

// Supabase server client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase env vars for tchart/save route");
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

    const user_email = session.user.email;

    // Read payload
    const payload = await req.json();
    const entries = payload?.entries;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No entries provided" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const rows = entries.map((e) => ({
      user_email,
      category: e.category,           // "ethos" | "pathos" | "logos"
      type: e.type,                   // "speech" | "letter"
      quote: e.quote || "",
      observation: e.observation || "",
      letter_url: e.letter_url || null,
      updated_at: now,
    }));

    // Upsert rows into tchart_entries
    const { data, error } = await supabase
      .from("tchart_entries")
      .upsert(rows, {
        onConflict: "user_email,category,type",
        ignoreDuplicates: false,
      })
      .select();

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