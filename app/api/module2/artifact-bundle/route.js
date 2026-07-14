import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  MODULE2_ARTIFACT_MODULE,
  mergeModule2ArtifactBundle,
  readModule2ArtifactBundle,
} from "@/lib/module2/module2ArtifactBundle";
import { readRhetoricalSituationSummary } from "@/lib/module2/rhetoricalSituationSummary";
import { normalizeEvidenceReader } from "@/lib/module2/normalizeEvidenceReader";

/**
 * GET /api/module2/artifact-bundle
 * Read-only: situation summary + matrix bundle + optional evidence union.
 * Viewing never writes.
 */
export async function GET(req) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeEvidence = searchParams.get("evidence") === "1";

  try {
    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase
      .from("student_buckets")
      .select("flow_state, buckets, updated_at")
      .eq("user_email", email)
      .eq("module", MODULE2_ARTIFACT_MODULE)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const bundle = readModule2ArtifactBundle(row?.flow_state);
    const summary = readRhetoricalSituationSummary(
      bundle.rhetoricalSituationSummary
    );

    let evidence = null;
    if (includeEvidence) {
      const [tchartRes, guidedRes] = await Promise.all([
        supabase.from("tchart_entries").select("*").eq("user_email", email),
        supabase
          .from("student_observations")
          .select("*")
          .eq("user_email", email)
          .eq("observation_stage", "guided"),
      ]);
      evidence = normalizeEvidenceReader({
        tchartRows: tchartRes.data || [],
        guidedRows: guidedRes.data || [],
      });
    }

    return NextResponse.json({
      ok: true,
      writeOnRead: false,
      summary,
      matrixBundle: bundle.matrixBundle,
      schemaVersion: bundle.schemaVersion,
      updatedAt: bundle.updatedAt || row?.updated_at || null,
      evidence,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/module2/artifact-bundle
 * Body: { rhetoricalSituationSummary?, matrixBundle? }
 * Merges into module-2 student_buckets.flow_state only.
 */
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
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: existing, error: fetchError } = await supabase
      .from("student_buckets")
      .select("*")
      .eq("user_email", email)
      .eq("module", MODULE2_ARTIFACT_MODULE)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const patch = {};
    if (body?.rhetoricalSituationSummary !== undefined) {
      patch.rhetoricalSituationSummary = body.rhetoricalSituationSummary;
    }
    if (body?.matrixBundle !== undefined) {
      patch.matrixBundle = body.matrixBundle;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No artifact fields to save" },
        { status: 400 }
      );
    }

    const nextFlow = mergeModule2ArtifactBundle(existing?.flow_state, patch);

    const { error } = await supabase.from("student_buckets").upsert(
      {
        user_email: email,
        module: MODULE2_ARTIFACT_MODULE,
        buckets: existing?.buckets ?? [],
        reflection: existing?.reflection ?? null,
        flow_state: nextFlow,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_email,module" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const bundle = readModule2ArtifactBundle(nextFlow);
    return NextResponse.json({
      ok: true,
      summary: readRhetoricalSituationSummary(
        bundle.rhetoricalSituationSummary
      ),
      matrixBundle: bundle.matrixBundle,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
