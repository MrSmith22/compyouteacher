import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { MLK_ASSIGNMENT_NAME } from "@/lib/assignments";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getModule2AnalysisAccessDecision,
  isRhetoricalSituationLessonSatisfied,
} from "@/lib/module2/rhetoricalSituationGate";
import { isModule2SourcePreparationComplete } from "@/lib/module2/module2SourceReadiness";

/**
 * GET /api/module2/rhetorical-situation-status
 * Returns durable lesson readiness for Stage 6 / T Charts / legacy routes.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: "Please sign in to check your progress." },
      { status: 401 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    const [sourcesResult, assignmentResult, tchartResult, observationsResult] =
      await Promise.all([
        supabase
          .from("module2_sources")
          .select("mlk_text, lfbj_text, rhetorical_situation_completed_at")
          .eq("user_email", email)
          .maybeSingle(),
        supabase
          .from("student_assignments")
          .select("current_module, resume_path")
          .eq("user_email", email)
          .eq("assignment_name", MLK_ASSIGNMENT_NAME)
          .maybeSingle(),
        supabase
          .from("tchart_entries")
          .select("id", { count: "exact", head: true })
          .eq("user_email", email),
        supabase
          .from("student_observations")
          .select("id", { count: "exact", head: true })
          .eq("user_email", email),
      ]);

    // If the new column is missing in an environment that has not run the
    // migration yet, fall back to a select without it and rely on grandfathering.
    let sources = sourcesResult.data;
    let completedAt = sources?.rhetorical_situation_completed_at ?? null;
    if (sourcesResult.error) {
      const fallback = await supabase
        .from("module2_sources")
        .select("mlk_text, lfbj_text")
        .eq("user_email", email)
        .maybeSingle();
      sources = fallback.data;
      completedAt = null;
    }

    const sourcesReady = isModule2SourcePreparationComplete(sources);
    const satisfaction = isRhetoricalSituationLessonSatisfied({
      completedAt,
      currentModule: assignmentResult.data?.current_module ?? 0,
      resumePath: assignmentResult.data?.resume_path ?? "",
      tchartEntryCount: tchartResult.count || 0,
      guidedObservationCount: observationsResult.count || 0,
      devBypass: false,
    });

    const access = getModule2AnalysisAccessDecision({
      sourcesReady,
      lessonSatisfied: satisfaction.satisfied,
    });

    return NextResponse.json({
      sourcesReady,
      lessonComplete: satisfaction.satisfied,
      completedAt: satisfaction.completedAt,
      grandfathered: satisfaction.grandfathered,
      reason: satisfaction.reason,
      access,
    });
  } catch (err) {
    console.error("rhetorical-situation-status GET error:", err);
    return NextResponse.json(
      { error: "Could not check lesson progress." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/module2/rhetorical-situation-status
 * Body: { complete: true }
 * Records completion only (timestamp). Never stores a score.
 */
export async function POST(req) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: "Please sign in to save your progress." },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body?.complete !== true) {
    return NextResponse.json(
      { error: "Completion was not requested." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: existing, error: fetchError } = await supabase
      .from("module2_sources")
      .select("mlk_text, lfbj_text, rhetorical_situation_completed_at")
      .eq("user_email", email)
      .maybeSingle();

    if (fetchError) {
      console.error("rhetorical-situation-status POST fetch error:", fetchError);
      return NextResponse.json(
        {
          error:
            "We couldn’t save your progress. Please try again. If this keeps happening, ask your teacher for help.",
        },
        { status: 500 }
      );
    }

    if (!isModule2SourcePreparationComplete(existing)) {
      return NextResponse.json(
        {
          error:
            "Save both the speech and the letter before finishing this lesson.",
        },
        { status: 400 }
      );
    }

    const completedAt =
      existing?.rhetorical_situation_completed_at || new Date().toISOString();

    const { data, error } = await supabase
      .from("module2_sources")
      .update({
        rhetorical_situation_completed_at: completedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_email", email)
      .select("rhetorical_situation_completed_at")
      .maybeSingle();

    if (error) {
      console.error("rhetorical-situation-status POST error:", error);
      return NextResponse.json(
        {
          error:
            "We couldn’t save your progress. Please try again. If this keeps happening, ask your teacher for help.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      lessonComplete: true,
      completedAt: data?.rhetorical_situation_completed_at || completedAt,
      grandfathered: false,
      reason: "completed",
    });
  } catch (err) {
    console.error("rhetorical-situation-status POST error:", err);
    return NextResponse.json(
      {
        error:
          "We couldn’t save your progress. Please try again. If this keeps happening, ask your teacher for help.",
      },
      { status: 500 }
    );
  }
}
