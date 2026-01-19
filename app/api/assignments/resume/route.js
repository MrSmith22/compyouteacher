import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  getStudentAssignment,
  upsertResumePath,
} from "@/lib/supabase/helpers/studentAssignments";

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

    const userEmail = session.user.email;

    // Extract module number from resume_path ("/modules/2/tcharts" -> 2)
    const moduleMatch = resume_path.match(/\/modules\/(\d+)/);
    const currentModule = moduleMatch ? parseInt(moduleMatch[1], 10) : 1;

    // Check if an assignment row already exists (so we can label action)
    const { data: existing, error: existingError } =
      await getStudentAssignment({
        userEmail,
        assignmentName: assignment_name,
      });

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 }
      );
    }

    // Upsert resume path + module progress
    const { data: row, error: upsertError } = await upsertResumePath({
      userEmail,
      assignmentName: assignment_name,
      resumePath: resume_path,
      currentModule,
    });

    if (upsertError) {
      return NextResponse.json(
        { ok: false, error: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      action: existing ? "updated" : "inserted",
      row: row ?? null,
      updated: 1,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}