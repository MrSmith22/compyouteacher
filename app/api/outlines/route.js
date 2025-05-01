// JavaScript source code
// app/api/outlines/route.js

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Handle GET request (fetch outline)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const module = Number(searchParams.get("module"));

  if (!email || !module) {
    return NextResponse.json({ error: "Missing email or module" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("student_outlines")
    .select("*")
    .eq("user_email", email)
    .eq("module", module)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

// Handle POST request (save outline)
export async function POST(req) {
  const body = await req.json();

  const { user_email, module, outline } = body;
  if (!user_email || !module || !outline) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await supabase.from("student_outlines").upsert({
    user_email,
    module,
    outline,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Saved successfully" }, { status: 200 });
}
