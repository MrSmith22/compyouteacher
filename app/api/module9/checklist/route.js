import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const EXPECTED_ITEMS_LENGTH = 6;

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length !== EXPECTED_ITEMS_LENGTH) {
    return Array(EXPECTED_ITEMS_LENGTH).fill(false);
  }
  return items.slice(0, EXPECTED_ITEMS_LENGTH).map(Boolean);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("module9_checklist")
      .select("items, complete, updated_at")
      .eq("user_email", email)
      .maybeSingle();

    if (error) {
      console.error("module9_checklist GET error:", error);
      return NextResponse.json({ error: "Could not load checklist" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(null);
    }

    const items = normalizeItems(data.items);
    const complete = items.length === EXPECTED_ITEMS_LENGTH && items.every(Boolean);
    return NextResponse.json({
      items,
      complete,
      updated_at: data.updated_at ?? null,
    });
  } catch (err) {
    console.error("module9_checklist GET error:", err);
    return NextResponse.json({ error: "Could not load checklist" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawItems = body?.items;
  if (!Array.isArray(rawItems)) {
    return NextResponse.json({ error: "Invalid items: must be an array" }, { status: 400 });
  }
  if (rawItems.length !== EXPECTED_ITEMS_LENGTH) {
    return NextResponse.json(
      { error: `Invalid items: must have exactly ${EXPECTED_ITEMS_LENGTH} booleans` },
      { status: 400 }
    );
  }

  const items = normalizeItems(rawItems);
  const complete = items.every(Boolean);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("module9_checklist")
      .upsert(
        {
          user_email: email,
          items,
          complete,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_email" }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error("module9_checklist POST error:", error);
      return NextResponse.json({ error: "Could not save checklist" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Could not save checklist" }, { status: 500 });
    }

    const outItems = normalizeItems(data.items);
    const outComplete = outItems.length === EXPECTED_ITEMS_LENGTH && outItems.every(Boolean);
    return NextResponse.json({
      items: outItems,
      complete: outComplete,
      updated_at: data.updated_at ?? null,
    });
  } catch (err) {
    console.error("module9_checklist POST error:", err);
    return NextResponse.json({ error: "Could not save checklist" }, { status: 500 });
  }
}
