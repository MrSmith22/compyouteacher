import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase env vars");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Not signed in" },
        { status: 401 }
      );
    }

    const { assignment_name, resume_path } = await req.json();

    if (!assignment_name || !resume_path) {
      return NextResponse.json(
        { ok: false, error: "Missing assignment_name or resume_path" },
        { status: 400 }
      );
    }

    const user_email = session.user.email;

    // Extract module number from resume_path ("/modules/2/source" -> 2)
    const moduleMatch = resume_path.match(/\/modules\/(\d+)/);
    const current_module = moduleMatch ? parseInt(moduleMatch[1], 10) : 1;

    const now = new Date().toISOString();

    // 1) Try to update existing row first
    const { data: updatedRows, error: updateError } = await supabase
      .from("student_assignments")
      .update({
        resume_path,
        current_module,
        status: "in_progress",
        updated_at: now,
      })
      .eq("user_email", user_email)
      .eq("assignment_name", assignment_name)
      .select("id, user_email, assignment_name, resume_path, current_module, started_at, updated_at");

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    if (updatedRows && updatedRows.length > 0) {
      return NextResponse.json({
        ok: true,
        action: "updated",
        row: updatedRows[0],
      });
    }

    // 2) If no row existed, insert a new one
    const { data: insertedRows, error: insertError } = await supabase
      .from("student_assignments")
      .insert([
        {
          user_email,
          assignment_name,
          resume_path,
          current_module,
          status: "in_progress",
          started_at: now,
          updated_at: now,
        },
      ])
      .select("id, user_email, assignment_name, resume_path, current_module, started_at, updated_at");

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      action: "inserted",
      row: insertedRows?.[0] ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}