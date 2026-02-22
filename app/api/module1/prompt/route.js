import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function normalizeString(v) {
  return typeof v === "string" ? v.trim() : "";
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
      .from("module1_prompt_breakdown")
      .select(
        "task_verb, task_type, analysis_focus, required_angle, student_paraphrase, updated_at"
      )
      .eq("user_email", email)
      .maybeSingle();

    if (error) {
      console.error("module1_prompt_breakdown GET error:", error);
      return NextResponse.json({ error: "Could not load prompt breakdown" }, { status: 500 });
    }

    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("module1_prompt_breakdown GET error:", err);
    return NextResponse.json({ error: "Could not load prompt breakdown" }, { status: 500 });
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

  const payload = {
    user_email: email,
    task_verb: normalizeString(body?.task_verb),
    task_type: normalizeString(body?.task_type),
    analysis_focus: normalizeString(body?.analysis_focus),
    required_angle: normalizeString(body?.required_angle),
    student_paraphrase: normalizeString(body?.student_paraphrase),
    updated_at: new Date().toISOString(),
  };

  if (!payload.student_paraphrase) {
    return NextResponse.json(
      { error: "student_paraphrase is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("module1_prompt_breakdown")
      .upsert(payload, { onConflict: "user_email" })
      .select(
        "task_verb, task_type, analysis_focus, required_angle, student_paraphrase, updated_at"
      )
      .maybeSingle();

    if (error) {
      console.error("module1_prompt_breakdown POST error:", error);
      return NextResponse.json({ error: "Could not save prompt breakdown" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("module1_prompt_breakdown POST error:", err);
    return NextResponse.json({ error: "Could not save prompt breakdown" }, { status: 500 });
  }
}