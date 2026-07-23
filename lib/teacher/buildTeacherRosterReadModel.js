/**
 * WP-100 — Assignment-scoped teacher roster read model (server builder).
 * Batch-loads metadata → pure projection. Never puts prose/URLs/notes on roster rows.
 * Production path only — deterministic synthetic fixtures stay in the fixtures module for tests/panel.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_ASSIGNMENT_NAME, MLK_ASSIGNMENT_ID } from "@/lib/assignments/identity";
import {
  areFormattingMovesComplete,
  isDocInspectionComplete,
  normalizeGuidedApaProtocolState,
} from "@/lib/module9/guidedApaProtocolState.js";
import {
  projectTeacherStudentProgress,
  sortTeacherRosterRows,
  summarizeTeacherRoster,
} from "@/lib/teacher/teacherProgressProjection.js";
import { mapBatchRowsToArtifactInput } from "@/lib/teacher/mapTeacherRosterArtifacts.js";

export { mapBatchRowsToArtifactInput } from "@/lib/teacher/mapTeacherRosterArtifacts.js";

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function hasNonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Index rows by user_email (last wins).
 * @param {Array<{user_email?: string}>} rows
 */
function indexByEmail(rows = []) {
  /** @type {Map<string, any>} */
  const map = new Map();
  for (const row of rows || []) {
    if (row?.user_email) map.set(row.user_email, row);
  }
  return map;
}

/**
 * Fetch assignment-scoped roster metadata in batch (no N+1).
 * @param {{
 *   assignmentName?: string,
 *   assignmentId?: string,
 * }} [options]
 */
export async function buildTeacherRosterReadModel(options = {}) {
  const assignmentName = options.assignmentName || DEFAULT_ASSIGNMENT_NAME;
  const assignmentId = options.assignmentId || MLK_ASSIGNMENT_ID;

  const supabase = getSupabaseAdmin();

  const assignmentsRes = await supabase
    .from("student_assignments")
    .select("user_email, assignment_name, current_module, updated_at, status")
    .eq("assignment_name", assignmentName);

  if (assignmentsRes.error) {
    return {
      ok: false,
      error: "roster_assignments_failed",
      detail: assignmentsRes.error,
    };
  }

  const assignments = assignmentsRes.data ?? [];
  const emails = assignments.map((a) => a.user_email).filter(Boolean);

  if (emails.length === 0) {
    return {
      ok: true,
      assignmentId,
      assignmentName,
      source: "live",
      summary: summarizeTeacherRoster([]),
      students: [],
      submissions: [],
    };
  }

  const [
    vocabRes,
    sourcesRes,
    bucketsRes,
    outlinesRes,
    draftsRes,
    docsRes,
    apaRes,
    exportsRes,
    quizRes,
    checklistRes,
  ] = await Promise.all([
    supabase
      .from("module1_vocabulary_transfer")
      .select("user_email, state, updated_at, schema_version")
      .in("user_email", emails)
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
    supabase
      .from("module2_sources")
      .select("user_email, mlk_text, lfbj_text, updated_at")
      .in("user_email", emails)
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
    supabase
      .from("student_buckets")
      .select("user_email, module, buckets, flow_state, updated_at")
      .in("user_email", emails)
      .in("module", [2, 3, 4])
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
    supabase
      .from("student_outlines")
      .select("user_email, module, outline, finalized, updated_at")
      .in("user_email", emails)
      .eq("module", 5)
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
    // Select text columns only to derive presence flags; never attach prose to output.
    supabase
      .from("student_drafts")
      .select(
        "user_email, module, locked, final_ready, revised, updated_at, final_text, full_text, sections"
      )
      .in("user_email", emails)
      .in("module", [6, 7, 8])
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
    supabase
      .from("exported_docs")
      .select("user_email, document_id, web_view_link, created_at")
      .in("user_email", emails)
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
    supabase
      .from("module9_guided_apa_protocol")
      .select("user_email, state, updated_at, schema_version")
      .in("user_email", emails)
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
    supabase
      .from("student_exports")
      .select(
        "user_email, storage_path, file_name, file_size, public_url, web_view_link, uploaded_at, created_at, grading_status"
      )
      .in("user_email", emails)
      .eq("module", 9)
      .eq("kind", "final_pdf")
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
    supabase
      .from("module9_quiz")
      .select("user_email, submitted_at")
      .in("user_email", emails)
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
    supabase
      .from("module9_checklist")
      .select("user_email, complete, updated_at")
      .in("user_email", emails)
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
  ]);

  const vocabBy = indexByEmail(vocabRes.data);
  const sourcesBy = indexByEmail(sourcesRes.data);
  const outlinesBy = indexByEmail(outlinesRes.data);
  const docsBy = indexByEmail(docsRes.data);
  const apaBy = indexByEmail(apaRes.data);
  const exportsBy = indexByEmail(exportsRes.data);
  const quizBy = indexByEmail(quizRes.data);
  const checklistBy = indexByEmail(checklistRes.data);

  /** @type {Map<string, any>} */
  const buckets2By = new Map();
  /** @type {Map<string, any>} */
  const buckets3By = new Map();
  /** @type {Map<string, any>} */
  const buckets4By = new Map();
  for (const row of bucketsRes.data || []) {
    if (row.module === 2) buckets2By.set(row.user_email, row);
    if (row.module === 3) buckets3By.set(row.user_email, row);
    if (row.module === 4) buckets4By.set(row.user_email, row);
  }

  /** @type {Map<string, any>} */
  const draft6By = new Map();
  /** @type {Map<string, any>} */
  const draft7By = new Map();
  /** @type {Map<string, any>} */
  const draft8By = new Map();
  for (const row of draftsRes.data || []) {
    const slim = {
      user_email: row.user_email,
      module: row.module,
      locked: row.locked,
      final_ready: row.final_ready,
      revised: row.revised,
      updated_at: row.updated_at,
      has_final_text: hasNonEmptyText(row.final_text),
      has_full_text: hasNonEmptyText(row.full_text),
      has_sections: Boolean(
        row.sections &&
          (Array.isArray(row.sections)
            ? row.sections.length > 0
            : Object.keys(row.sections).length > 0)
      ),
    };
    if (row.module === 6) draft6By.set(row.user_email, slim);
    if (row.module === 7) draft7By.set(row.user_email, slim);
    if (row.module === 8) draft8By.set(row.user_email, slim);
  }

  const projected = [];
  const submissions = [];

  for (const assignment of assignments) {
    const email = assignment.user_email;
    const sourcesRow = sourcesBy.get(email);
    const sourcesMeta = sourcesRow
      ? {
          user_email: email,
          mlk_text: sourcesRow.mlk_text ? "x" : "",
          lfbj_text: sourcesRow.lfbj_text ? "x" : "",
          updated_at: sourcesRow.updated_at,
        }
      : null;

    const docRow = docsBy.get(email);
    const apaRow = apaBy.get(email);
    let malformedArtifact = false;
    if (apaRow?.schema_version != null && Number(apaRow.schema_version) > 100) {
      malformedArtifact = true;
    }
    const vocabRow = vocabBy.get(email);
    if (vocabRow?.schema_version != null) {
      const v = Number(vocabRow.schema_version);
      if (Number.isFinite(v) && v > 100) malformedArtifact = true;
    }

    const mapped = mapBatchRowsToArtifactInput({
      assignment,
      assignmentId,
      email,
      displayName: null,
      vocabTransfer: vocabRow || null,
      sources: sourcesMeta,
      buckets2: buckets2By.get(email) || null,
      buckets3: buckets3By.get(email) || null,
      buckets4: buckets4By.get(email) || null,
      outline: outlinesBy.get(email) || null,
      draft6: draft6By.get(email) || null,
      draft7: draft7By.get(email) || null,
      draft8: draft8By.get(email) || null,
      exportedDoc: docRow
        ? {
            document_id: docRow.document_id,
            has_pointer: Boolean(docRow.document_id || docRow.web_view_link),
            web_view_link: docRow.web_view_link,
            created_at: docRow.created_at,
          }
        : null,
      guidedApa: apaRow || null,
      exportPdf: exportsBy.get(email) || null,
      quiz: quizBy.get(email) || null,
      checklist: checklistBy.get(email) || null,
      malformedArtifact,
      futureVersionArtifact: malformedArtifact,
    });

    const row = projectTeacherStudentProgress(mapped);
    projected.push(row);

    if (row.receiptStatus?.submitted) {
      submissions.push({
        studentId: row.studentId,
        email: row.email,
        displayName: row.displayName,
        submittedAt: row.receiptStatus.submittedAt,
        gradingStatus: mapped._detail?.gradingStatus || "ungraded",
      });
    }
  }

  const students = sortTeacherRosterRows(projected);
  return {
    ok: true,
    assignmentId,
    assignmentName,
    source: "live",
    summary: summarizeTeacherRoster(students),
    students,
    submissions,
  };
}

/**
 * Least-data student detail. Requires assignment membership.
 * Omits default full final_text; Doc/PDF URLs only here.
 * @param {string} studentEmail
 * @param {{ assignmentName?: string }} [options]
 */
export async function buildTeacherStudentDetailReadModel(
  studentEmail,
  options = {}
) {
  const assignmentName = options.assignmentName || DEFAULT_ASSIGNMENT_NAME;
  const supabase = getSupabaseAdmin();
  const email = String(studentEmail || "");

  const assignmentRes = await supabase
    .from("student_assignments")
    .select("user_email, current_module, updated_at, status")
    .eq("user_email", email)
    .eq("assignment_name", assignmentName)
    .maybeSingle();

  if (assignmentRes.error) {
    return { ok: false, error: "assignment_lookup_failed" };
  }
  if (!assignmentRes.data) {
    return { ok: false, error: "not_in_assignment", status: 404 };
  }

  const [
    draft8Res,
    pdfRes,
    docRes,
    quizRes,
    checklistRes,
    notesRes,
    apaRes,
  ] = await Promise.all([
    supabase
      .from("student_drafts")
      .select("final_ready, updated_at")
      .eq("user_email", email)
      .eq("module", 8)
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase
      .from("student_exports")
      .select(
        "storage_path, file_name, file_size, public_url, web_view_link, uploaded_at, created_at, grading_status"
      )
      .eq("user_email", email)
      .eq("module", 9)
      .eq("kind", "final_pdf")
      .order("uploaded_at", { ascending: false, nullsFirst: false })
      .limit(1),
    supabase
      .from("exported_docs")
      .select("document_id, web_view_link, created_at")
      .eq("user_email", email)
      .maybeSingle(),
    supabase
      .from("module9_quiz")
      .select("score, total, submitted_at")
      .eq("user_email", email)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
    supabase
      .from("module9_checklist")
      .select("complete, updated_at")
      .eq("user_email", email)
      .order("updated_at", { ascending: false })
      .limit(1)
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
    supabase
      .from("teacher_notes")
      .select("note")
      .eq("student_email", email)
      .eq("assignment_name", assignmentName)
      .limit(1)
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
    supabase
      .from("module9_guided_apa_protocol")
      .select("state, updated_at")
      .eq("user_email", email)
      .maybeSingle()
      .then((r) => (r.error ? { data: null, error: r.error } : r)),
  ]);

  const draft8 = draft8Res.data?.[0] ?? null;
  const pdf = pdfRes.data?.[0] ?? null;
  const doc = docRes.data ?? null;
  const quizRow = quizRes.data?.[0] ?? null;
  const checklistRow = checklistRes.data?.[0] ?? null;

  const receipt = pdf
    ? {
        hasReceiptRow: true,
        storagePath: pdf.storage_path || null,
        fileName: pdf.file_name || null,
        byteSize:
          pdf.file_size != null && !Number.isNaN(Number(pdf.file_size))
            ? Number(pdf.file_size)
            : null,
        submittedAt: pdf.uploaded_at || pdf.created_at || null,
      }
    : null;

  let guidedApaComplete = false;
  if (apaRes.data?.state) {
    try {
      const state = normalizeGuidedApaProtocolState(apaRes.data.state);
      guidedApaComplete =
        areFormattingMovesComplete(state) && isDocInspectionComplete(state);
    } catch {
      guidedApaComplete = false;
    }
  }

  const progress = projectTeacherStudentProgress({
    studentId: email,
    email,
    assignmentId: MLK_ASSIGNMENT_ID,
    currentModule: assignmentRes.data?.current_module ?? null,
    latestUpdateAt: assignmentRes.data?.updated_at || null,
    artifacts: {
      hasGoogleDoc: Boolean(doc?.document_id || doc?.web_view_link),
      guidedApaComplete,
      prepareCompleteClaimed: Boolean(draft8?.final_ready) && !doc,
      finalReady: Boolean(draft8?.final_ready),
    },
    receipt,
    historical: {
      hasQuizRecord: Boolean(quizRow),
      hasChecklistRecord: Boolean(checklistRow),
    },
  });

  const quizScore = quizRow?.score != null ? Number(quizRow.score) : null;
  const quizTotal = quizRow?.total != null ? Number(quizRow.total) : null;

  return {
    ok: true,
    student: {
      email,
      progress,
      googleDoc: doc?.web_view_link
        ? { url: doc.web_view_link, createdAt: doc.created_at || null }
        : null,
      finalPdf: pdf
        ? {
            url: pdf.public_url || pdf.web_view_link || null,
            fileName: pdf.file_name || null,
            fileSize:
              pdf.file_size != null && !Number.isNaN(Number(pdf.file_size))
                ? Number(pdf.file_size)
                : null,
            uploadedAt: pdf.uploaded_at || null,
            createdAt: pdf.created_at || null,
            gradingStatus: pdf.grading_status || "ungraded",
          }
        : null,
      module8: draft8
        ? {
            finalReady: Boolean(draft8.final_ready),
            updatedAt: draft8.updated_at || null,
          }
        : null,
      note: notesRes.data?.[0]?.note ?? "",
      historicalRecords: {
        label: "Historical records",
        quiz: quizRow
          ? {
              score: quizScore,
              total: quizTotal,
              percent:
                quizTotal != null && quizTotal > 0 && quizScore != null
                  ? Math.round((quizScore / quizTotal) * 100)
                  : null,
              submittedAt: quizRow.submitted_at || null,
            }
          : null,
        checklist: checklistRow
          ? {
              complete: Boolean(checklistRow.complete),
              updatedAt: checklistRow.updated_at || null,
            }
          : null,
      },
    },
  };
}
