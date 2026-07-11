import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { mlkAssignmentDefinition } from "@/lib/assignments";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MODULE2_SOURCES = mlkAssignmentDefinition.sources;

// Front-end-friendly defaults for fields that don't exist in the DB (response only)
const SPEECH_RESPONSE_DEFAULTS = {
  speech_source_title: MODULE2_SOURCES.speech.title,
  speech_site_name: MODULE2_SOURCES.speech.apiDefaultSiteName,
  speech_author: "Martin Luther King Jr.",
};

const LETTER_RESPONSE_DEFAULTS = {
  letter_source_title: MODULE2_SOURCES.letter.title,
  letter_site_name: MODULE2_SOURCES.letter.apiDefaultSiteName,
  letter_author: "Martin Luther King Jr.",
};

function normalizeString(v) {
  if (v == null) return "";
  return typeof v === "string" ? v.trim() : "";
}

function normalizeDate(v) {
  if (v == null || v === "") return null;
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  return null;
}

/** Map DB row (old column names) to API response (new column names + defaults) */
function rowToResponse(row, today) {
  if (!row) return null;
  return {
    ...row,
    speech_source_url: row.mlk_url ?? null,
    speech_full_text: row.mlk_text ?? null,
    speech_site_name: row.mlk_site_name ?? null,
    speech_source_title: SPEECH_RESPONSE_DEFAULTS.speech_source_title,
    speech_author: SPEECH_RESPONSE_DEFAULTS.speech_author,
    speech_accessed_date: today,
    letter_source_url: row.lfbj_url ?? null,
    letter_full_text: row.lfbj_text ?? null,
    letter_site_name: row.lfbj_site_name ?? null,
    letter_source_title: LETTER_RESPONSE_DEFAULTS.letter_source_title,
    letter_author: LETTER_RESPONSE_DEFAULTS.letter_author,
    letter_accessed_date: today,
    rhetorical_situation_completed_at:
      row.rhetorical_situation_completed_at ?? null,
  };
}

const SOURCES_SELECT =
  "id, user_email, mlk_url, mlk_text, mlk_site_name, mlk_transcript_year, mlk_citation, lfbj_url, lfbj_text, lfbj_site_name, lfbj_transcript_year, lfbj_citation, rhetorical_situation_completed_at, created_at, updated_at";

const SOURCES_SELECT_LEGACY =
  "id, user_email, mlk_url, mlk_text, mlk_site_name, mlk_transcript_year, mlk_citation, lfbj_url, lfbj_text, lfbj_site_name, lfbj_transcript_year, lfbj_citation, created_at, updated_at";

async function selectModule2SourcesRow(supabase, email) {
  const withColumn = await supabase
    .from("module2_sources")
    .select(SOURCES_SELECT)
    .eq("user_email", email)
    .maybeSingle();

  if (!withColumn.error) {
    return withColumn;
  }

  return supabase
    .from("module2_sources")
    .select(SOURCES_SELECT_LEGACY)
    .eq("user_email", email)
    .maybeSingle();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: "Please sign in to load your saved sources." },
      { status: 401 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await selectModule2SourcesRow(supabase, email);

    if (error) {
      console.error("module2_sources GET error:", error);
      return NextResponse.json(
        { error: "Could not load your saved sources." },
        { status: 500 }
      );
    }

    return NextResponse.json(rowToResponse(data, today));
  } catch (err) {
    console.error("module2_sources GET error:", err);
    return NextResponse.json(
      { error: "Could not load your saved sources." },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: "Please sign in to save your sources." },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Please try again." },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const supabase = getSupabaseAdmin();
    const { data: existing } = await selectModule2SourcesRow(supabase, email);
    const row = existing || {};

    // Incoming body uses new names; normalize
    const speechSourceUrl = normalizeString(body?.speech_source_url);
    const speechSiteName = normalizeString(body?.speech_site_name);
    const speechFullText = normalizeString(body?.speech_full_text);

    const letterSourceUrl = normalizeString(body?.letter_source_url);
    const letterSiteName = normalizeString(body?.letter_site_name);
    const letterFullText = normalizeString(body?.letter_full_text);

    // Build payload using only existing DB columns; merge with existing for partial saves
    const payload = {
      user_email: email,
      mlk_url:
        speechSourceUrl !== "" ? speechSourceUrl : row.mlk_url ?? null,
      mlk_site_name:
        speechSiteName !== ""
          ? speechSiteName
          : row.mlk_site_name ?? SPEECH_RESPONSE_DEFAULTS.speech_site_name,
      mlk_text:
        speechFullText !== "" ? speechFullText : row.mlk_text ?? null,
      mlk_transcript_year: row.mlk_transcript_year ?? null,
      mlk_citation: row.mlk_citation ?? null,
      lfbj_url:
        letterSourceUrl !== "" ? letterSourceUrl : row.lfbj_url ?? null,
      lfbj_site_name:
        letterSiteName !== ""
          ? letterSiteName
          : row.lfbj_site_name ?? LETTER_RESPONSE_DEFAULTS.letter_site_name,
      lfbj_text:
        letterFullText !== "" ? letterFullText : row.lfbj_text ?? null,
      lfbj_transcript_year: row.lfbj_transcript_year ?? null,
      lfbj_citation: row.lfbj_citation ?? null,
      // Preserve durable lesson completion; never clear it when saving texts.
      rhetorical_situation_completed_at:
        row.rhetorical_situation_completed_at ?? null,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from("module2_sources")
      .upsert(payload, { onConflict: "user_email" })
      .select(SOURCES_SELECT)
      .maybeSingle();

    if (error) {
      // Environments that have not run the migration yet.
      const legacyPayload = { ...payload };
      delete legacyPayload.rhetorical_situation_completed_at;
      const legacy = await supabase
        .from("module2_sources")
        .upsert(legacyPayload, { onConflict: "user_email" })
        .select(SOURCES_SELECT_LEGACY)
        .maybeSingle();
      data = legacy.data;
      error = legacy.error;
    }

    if (error) {
      console.error("module2_sources POST error:", error);
      return NextResponse.json(
        { error: "Could not save your sources. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(rowToResponse(data, today));
  } catch (err) {
    console.error("module2_sources POST error:", err);
    return NextResponse.json(
      { error: "Could not save your sources. Please try again." },
      { status: 500 }
    );
  }
}
