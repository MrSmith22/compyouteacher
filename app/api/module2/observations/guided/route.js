import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  getStudentObservations,
  getStudentObservationBySourceId,
  saveStudentObservation,
  updateStudentObservation,
} from "@/lib/supabase/helpers/studentObservations";
import { mlkRhetoricalAnalysisAssignment } from "@/lib/assignments/mlkRhetoricalAnalysis";

const ASSIGNMENT_ID = mlkRhetoricalAnalysisAssignment.assignmentId;

// GET /api/module2/observations/guided
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

    const { data, error } = await getStudentObservations({
      userEmail: email,
      assignmentId: ASSIGNMENT_ID,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const guided = (data ?? []).filter(
      (row) => row.observation_stage === "guided"
    );

    return NextResponse.json({ ok: true, data: guided }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

// POST /api/module2/observations/guided
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
    const sourceId = body?.source_id;

    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing source_id" },
        { status: 400 }
      );
    }

    const fields = {
      source_id: sourceId,
      source_title: body?.source_title ?? null,
      source_type: body?.source_type ?? null,
      quote: body?.quote ?? "",
      rhetorical_strategy: body?.rhetorical_strategy ?? null,
      student_observation: body?.student_observation ?? "",
      audience_effect: body?.audience_effect ?? "",
      purpose_connection: body?.purpose_connection ?? "",
      essential_question_connection: body?.essential_question_connection ?? "",
      observation_stage: "guided",
      teacher_guided: true,
    };

    const { data: existing, error: findError } =
      await getStudentObservationBySourceId({
        userEmail: email,
        assignmentId: ASSIGNMENT_ID,
        sourceId,
      });

    if (findError) {
      console.error("[guided-observations POST] find error:", findError);
      return NextResponse.json(
        { ok: false, error: findError.message },
        { status: 500 }
      );
    }

    if (existing?.id) {
      const { data, error } = await updateStudentObservation(existing.id, fields);

      if (error) {
        console.error("[guided-observations POST] update error:", error);
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, data, updated: true }, { status: 200 });
    }

    const { data, error } = await saveStudentObservation({
      user_email: email,
      assignment_id: ASSIGNMENT_ID,
      ...fields,
    });

    if (error) {
      console.error("[guided-observations POST] insert error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data, updated: false }, { status: 200 });
  } catch (err) {
    console.error("[guided-observations POST] exception:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
