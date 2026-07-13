/**
 * Server-side helpers for the Developer Testing Panel.
 * DEV ONLY — called exclusively from /api/dev/panel.
 */
import { DEFAULT_ASSIGNMENT_NAME } from "@/lib/assignments";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_MODULE = 10;

async function getEssayTextForExportAdmin(userEmail: string) {
  const supabase = getSupabaseAdmin();
  const res7 = await supabase
    .from("student_drafts")
    .select("final_text, full_text")
    .eq("user_email", userEmail)
    .eq("module", 7)
    .maybeSingle();
  const m7Final = String(res7.data?.final_text ?? "").trim();
  if (m7Final) {
    return { status: "ok" as const, text: m7Final, sourceModule: 7 as const };
  }
  const m7Full = String(res7.data?.full_text ?? "").trim();
  if (m7Full) {
    return { status: "ok" as const, text: m7Full, sourceModule: 7 as const };
  }

  const res6 = await supabase
    .from("student_drafts")
    .select("full_text")
    .eq("user_email", userEmail)
    .eq("module", 6)
    .maybeSingle();
  const m6Text = String(res6.data?.full_text ?? "").trim();
  if (m6Text) {
    return { status: "ok" as const, text: m6Text, sourceModule: 6 as const };
  }

  return { status: "missing" as const, text: "", sourceModule: null };
}

type DeleteSpec = {
  table: string;
  filters?: Record<string, string | number>;
};

const MODULE_RESET_MAP: Record<number, DeleteSpec[]> = {
  // Restart Module 1 must clear both quiz results AND prompt breakdown,
  // otherwise paraphrase shelf / Step 1 skip survive a supposed restart.
  1: [
    { table: "module1_quiz_results" },
    { table: "module1_prompt_breakdown" },
  ],
  2: [{ table: "module2_sources" }, { table: "tchart_entries" }],
  3: [
    { table: "student_buckets", filters: { module: 3 } },
    { table: "module3_responses" },
  ],
  4: [{ table: "student_buckets", filters: { module: 4 } }],
  5: [{ table: "student_outlines" }],
  6: [{ table: "student_drafts", filters: { module: 6 } }],
  7: [
    { table: "student_drafts", filters: { module: 7 } },
    { table: "student_readaloud" },
  ],
  8: [{ table: "student_drafts", filters: { module: 8 } }],
  9: [
    { table: "module9_quiz" },
    { table: "module9_checklist" },
    { table: "student_exports", filters: { module: 9, kind: "final_pdf" } },
  ],
};

async function deleteBySpec(userEmail: string, spec: DeleteSpec) {
  const supabase = getSupabaseAdmin();
  let q = supabase.from(spec.table).delete({ count: "exact" }).eq("user_email", userEmail);
  if (spec.filters) {
    for (const [key, value] of Object.entries(spec.filters)) {
      q = q.eq(key, value);
    }
  }
  const { error, count } = await q;
  return { table: spec.table, deleted: typeof count === "number" ? count : 0, error: error?.message ?? null };
}

export async function getDevPanelStatus(userEmail: string) {
  const supabase = getSupabaseAdmin();
  const assignmentName = DEFAULT_ASSIGNMENT_NAME;

  const [
    assignmentRes,
    exportDocRes,
    quizRes,
    checklistRes,
    pdfRes,
    draft6Res,
    draft7Res,
    outlineRes,
    buckets4Res,
    tchartRes,
  ] = await Promise.all([
    supabase
      .from("student_assignments")
      .select("current_module, assignment_name, status, resume_path")
      .eq("user_email", userEmail)
      .eq("assignment_name", assignmentName)
      .maybeSingle(),
    supabase
      .from("exported_docs")
      .select("web_view_link, document_id, created_at")
      .eq("user_email", userEmail)
      .maybeSingle(),
    supabase
      .from("module9_quiz")
      .select("score, total, submitted_at")
      .eq("user_email", userEmail)
      .maybeSingle(),
    supabase
      .from("module9_checklist")
      .select("items, complete, updated_at")
      .eq("user_email", userEmail)
      .maybeSingle(),
    supabase
      .from("student_exports")
      .select("id, public_url, file_name, uploaded_at")
      .eq("user_email", userEmail)
      .eq("module", 9)
      .eq("kind", "final_pdf")
      .maybeSingle(),
    supabase
      .from("student_drafts")
      .select("full_text, locked, updated_at, draft_meta, sections")
      .eq("user_email", userEmail)
      .eq("module", 6)
      .maybeSingle(),
    supabase
      .from("student_drafts")
      .select("full_text, final_text, locked, final_ready, updated_at")
      .eq("user_email", userEmail)
      .eq("module", 7)
      .maybeSingle(),
    supabase
      .from("student_outlines")
      .select("outline, finalized, updated_at")
      .eq("user_email", userEmail)
      .eq("module", 5)
      .maybeSingle(),
    supabase
      .from("student_buckets")
      .select("buckets")
      .eq("user_email", userEmail)
      .eq("module", 4)
      .maybeSingle(),
    supabase
      .from("tchart_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_email", userEmail),
  ]);

  const assignmentRow = assignmentRes.data ?? null;
  const assignmentError = assignmentRes.error?.message ?? null;

  const rawModule = assignmentRow?.current_module;
  const coercedModule =
    typeof rawModule === "number"
      ? rawModule
      : typeof rawModule === "string" && rawModule.trim() !== "" && Number.isFinite(Number(rawModule))
        ? Number(rawModule)
        : null;
  const currentModule =
    coercedModule != null && Number.isFinite(coercedModule)
      ? coercedModule
      : null;

  const checklistItems = Array.isArray(checklistRes.data?.items)
    ? checklistRes.data.items
    : null;
  const checklistComplete =
    checklistRes.data?.complete === true ||
    (Array.isArray(checklistItems) &&
      checklistItems.length > 0 &&
      checklistItems.every(Boolean));

  const outlineExists = !!outlineRes.data?.outline;
  const outlineFinalized = outlineRes.data?.finalized === true;
  const paragraphPlans = Array.isArray(buckets4Res.data?.buckets)
    ? buckets4Res.data.buckets.length
    : 0;
  const observationsCount =
    typeof tchartRes.count === "number" ? tchartRes.count : 0;

  return {
    userEmail,
    assignmentName,
    assignmentRowFound: !!assignmentRow,
    assignmentError,
    currentModule,
    assignmentStatus: assignmentRow?.status ?? null,
    resumePath: assignmentRow?.resume_path ?? null,
    googleDocUrl: exportDocRes.data?.web_view_link ?? null,
    googleDocId: exportDocRes.data?.document_id ?? null,
    googleDocError: exportDocRes.error?.message ?? null,
    quizComplete: !!quizRes.data?.submitted_at,
    quizScore:
      quizRes.data?.score != null
        ? `${quizRes.data.score}/${quizRes.data.total ?? "?"}`
        : null,
    checklistComplete,
    pdfUploaded: !!pdfRes.data,
    pdfFileName: pdfRes.data?.file_name ?? null,
    draft6Present: !!draft6Res.data?.full_text,
    draft6Locked: draft6Res.data?.locked === true,
    draft6CurrentSection:
      (draft6Res.data as { draft_meta?: { currentStageId?: string } } | null)
        ?.draft_meta?.currentStageId || null,
    draft6OutlineReviewRequired: Boolean(
      (draft6Res.data as { draft_meta?: { outlineReviewRequired?: boolean } } | null)
        ?.draft_meta?.outlineReviewRequired
    ),
    draft7Present: !!(draft7Res.data?.final_text || draft7Res.data?.full_text),
    draft7FinalReady: draft7Res.data?.final_ready === true,
    outlineExists,
    outlineFinalized,
    paragraphPlans,
    observationsCount,
    googleDoc: !!exportDocRes.data?.web_view_link || !!exportDocRes.data?.document_id,
    pdf: !!pdfRes.data,
    moduleComplete: typeof currentModule === "number" && currentModule > 9,
  };
}

export async function setCurrentModule(userEmail: string, moduleNumber: number) {
  const supabase = getSupabaseAdmin();
  if (!Number.isFinite(moduleNumber)) {
    return { ok: false as const, error: "Invalid module number", module: null };
  }
  const next = Math.min(Math.max(1, Math.floor(moduleNumber)), MAX_MODULE);
  const now = new Date().toISOString();
  const resumePath = `/modules/${Math.min(next, 9)}`;
  const assignmentName = DEFAULT_ASSIGNMENT_NAME;

  // Prefer explicit update/insert over upsert so we never depend on onConflict
  // matching, and so we do not rewrite started_at on every jump.
  const existingRes = await supabase
    .from("student_assignments")
    .select("id, current_module")
    .eq("user_email", userEmail)
    .eq("assignment_name", assignmentName)
    .maybeSingle();

  if (existingRes.error) {
    return {
      ok: false as const,
      error: existingRes.error.message,
      module: next,
    };
  }

  if (existingRes.data?.id) {
    const { error } = await supabase
      .from("student_assignments")
      .update({
        current_module: next,
        resume_path: resumePath,
        status: "in_progress",
        updated_at: now,
      })
      .eq("user_email", userEmail)
      .eq("assignment_name", assignmentName);

    if (error) {
      return { ok: false as const, error: error.message, module: next };
    }
  } else {
    const { error } = await supabase.from("student_assignments").insert({
      user_email: userEmail,
      assignment_name: assignmentName,
      current_module: next,
      resume_path: resumePath,
      status: "in_progress",
      started_at: now,
      updated_at: now,
    });

    if (error) {
      return { ok: false as const, error: error.message, module: next };
    }
  }

  const verify = await supabase
    .from("student_assignments")
    .select("current_module")
    .eq("user_email", userEmail)
    .eq("assignment_name", assignmentName)
    .maybeSingle();

  const verifiedRaw = verify.data?.current_module;
  const verified =
    typeof verifiedRaw === "number"
      ? verifiedRaw
      : typeof verifiedRaw === "string" && Number.isFinite(Number(verifiedRaw))
        ? Number(verifiedRaw)
        : null;

  if (verify.error) {
    return { ok: false as const, error: verify.error.message, module: next };
  }
  if (verified !== next) {
    return {
      ok: false as const,
      error: `Write did not stick (expected current_module=${next}, got ${String(verifiedRaw)})`,
      module: next,
    };
  }

  return { ok: true as const, module: next, resumePath };
}

export async function completeCurrentModule(userEmail: string) {
  const status = await getDevPanelStatus(userEmail);
  const current = status.currentModule ?? 1;
  return setCurrentModule(userEmail, current + 1);
}

export async function resetCurrentModule(userEmail: string, moduleNumber?: number) {
  const status = await getDevPanelStatus(userEmail);
  const module = moduleNumber ?? status.currentModule ?? 1;
  const specs = MODULE_RESET_MAP[module] ?? [];
  const results = [];
  for (const spec of specs) {
    results.push(await deleteBySpec(userEmail, spec));
  }
  // After Module 1 content wipe, progression must not still claim later modules
  // while Step 1 is empty — pin resume to Module 1 prompt entry.
  if (module === 1) {
    await setCurrentModule(userEmail, 1);
  }
  return {
    ok: true as const,
    module,
    results,
    actionLabel: module === 1 ? "Restart Module 1" : `Reset Module ${module}`,
    resumePath: module === 1 ? "/modules/1/prompt" : undefined,
  };
}

/**
 * Explicit: Restart Module 1 (prompt + quiz + progression pin).
 * Does not delete Module 2+ tables; caller should warn when downstream exists.
 */
export async function restartModule1(userEmail: string) {
  const results = [];
  for (const spec of MODULE_RESET_MAP[1]) {
    results.push(await deleteBySpec(userEmail, spec));
  }
  const progression = await setCurrentModule(userEmail, 1);
  return {
    ok: progression.ok,
    actionLabel: "Restart Module 1",
    results,
    module: 1,
    resumePath: "/modules/1/prompt",
    error: progression.ok ? null : progression.error,
  };
}

/**
 * Explicit: Restart the entire assignment — same wipe set as reset-student
 * plus module1_prompt_breakdown (historically omitted).
 */
export async function restartEntireAssignment(userEmail: string) {
  const supabase = getSupabaseAdmin();
  const tablesToClear: Array<{ key: string; table: string }> = [
    { key: "student_readaloud", table: "student_readaloud" },
    { key: "student_drafts", table: "student_drafts" },
    { key: "student_outlines", table: "student_outlines" },
    { key: "bucket_groups", table: "bucket_groups" },
    { key: "student_buckets", table: "student_buckets" },
    { key: "tchart_entries", table: "tchart_entries" },
    { key: "student_exports", table: "student_exports" },
    { key: "exported_docs", table: "exported_docs" },
    { key: "module3_responses", table: "module3_responses" },
    { key: "module2_sources", table: "module2_sources" },
    { key: "module1_quiz_results", table: "module1_quiz_results" },
    { key: "module1_prompt_breakdown", table: "module1_prompt_breakdown" },
    { key: "module9_quiz", table: "module9_quiz" },
    { key: "module9_checklist", table: "module9_checklist" },
    { key: "student_activity_log", table: "student_activity_log" },
    { key: "module_scores", table: "module_scores" },
    { key: "student_assignments", table: "student_assignments" },
  ];

  const deleted: Record<string, number> = {};
  let anyError = false;
  for (const { key, table } of tablesToClear) {
    const { error, count } = await supabase
      .from(table)
      .delete({ count: "exact" })
      .eq("user_email", userEmail);
    if (error) {
      anyError = true;
      deleted[key] = 0;
    } else {
      deleted[key] = typeof count === "number" ? count : 0;
    }
  }

  return {
    ok: !anyError,
    actionLabel: "Restart the entire assignment",
    deleted,
    resumePath: "/modules/1/prompt",
    entry: { module: 1, step: 1, question: 1 },
  };
}

export async function setModule9Shortcut(
  userEmail: string,
  key:
    | "googleDoc"
    | "checklist"
    | "quiz"
    | "pdf"
    | "moduleComplete",
  enabled: boolean
) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (key === "checklist") {
    if (enabled) {
      const items = Array(6).fill(true);
      const { error } = await supabase.from("module9_checklist").upsert(
        {
          user_email: userEmail,
          items,
          complete: true,
          updated_at: now,
        },
        { onConflict: "user_email" }
      );
      if (error) return { ok: false as const, error: error.message };
    } else {
      await supabase.from("module9_checklist").delete().eq("user_email", userEmail);
    }
    return { ok: true as const };
  }

  if (key === "quiz") {
    if (enabled) {
      const { error } = await supabase.from("module9_quiz").upsert({
        user_email: userEmail,
        score: 10,
        total: 10,
        submitted_at: now,
      });
      if (error) return { ok: false as const, error: error.message };
    } else {
      await supabase.from("module9_quiz").delete().eq("user_email", userEmail);
    }
    return { ok: true as const };
  }

  if (key === "pdf") {
    if (enabled) {
      const existing = await supabase
        .from("student_exports")
        .select("id")
        .eq("user_email", userEmail)
        .eq("module", 9)
        .eq("kind", "final_pdf")
        .maybeSingle();
      if (existing.error) return { ok: false as const, error: existing.error.message };

      const pdfFields = {
        file_name: "dev-stub.pdf",
        storage_path: `dev/${userEmail}/dev-stub.pdf`,
        public_url: "https://example.com/dev-stub.pdf",
        web_view_link: "https://example.com/dev-stub.pdf",
        uploaded_at: now,
        grading_status: "ungraded",
      };

      if (existing.data?.id) {
        const { error } = await supabase
          .from("student_exports")
          .update(pdfFields)
          .eq("id", existing.data.id);
        if (error) return { ok: false as const, error: error.message };
      } else {
        const { error } = await supabase.from("student_exports").insert({
          doc_id: `dev_${Date.now()}`,
          user_email: userEmail,
          module: 9,
          kind: "final_pdf",
          ...pdfFields,
        });
        if (error) return { ok: false as const, error: error.message };
      }
    } else {
      await supabase
        .from("student_exports")
        .delete()
        .eq("user_email", userEmail)
        .eq("module", 9)
        .eq("kind", "final_pdf");
    }
    return { ok: true as const };
  }

  if (key === "googleDoc") {
    if (enabled) {
      const exportRes = await getEssayTextForExportAdmin(userEmail);
      if (exportRes.status === "ok" && exportRes.text) {
        try {
          const { exportEssayToGoogleDocs } = await import(
            "@/lib/exports/exportEssayToGoogleDocs"
          );
          const result = await exportEssayToGoogleDocs({
            email: userEmail,
            text: exportRes.text,
          });
          return {
            ok: true as const,
            source: "production_pipeline" as const,
            documentId: result.documentId,
            webViewLink: result.webViewLink,
          };
        } catch (err) {
          console.warn(
            "[devPanel] Google Doc export failed, using stub:",
            err instanceof Error ? err.message : err
          );
        }
      }
      const { error } = await supabase.from("exported_docs").upsert(
        {
          user_email: userEmail,
          document_id: `dev-doc-${Date.now()}`,
          web_view_link: "https://docs.google.com/document/d/dev-stub/edit",
        },
        { onConflict: "user_email" }
      );
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, source: "placeholder_fallback" as const };
    } else {
      await supabase.from("exported_docs").delete().eq("user_email", userEmail);
    }
    return { ok: true as const };
  }

  if (key === "moduleComplete") {
    if (enabled) {
      return setCurrentModule(userEmail, 10);
    }
    return setCurrentModule(userEmail, 9);
  }

  return { ok: false as const, error: "Unknown shortcut" };
}

export async function deleteGoogleDocRecord(userEmail: string) {
  const supabase = getSupabaseAdmin();
  const { error, count } = await supabase
    .from("exported_docs")
    .delete({ count: "exact" })
    .eq("user_email", userEmail);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, deleted: typeof count === "number" ? count : 0 };
}

export async function prepareGoogleDocExport(userEmail: string) {
  const exportRes = await getEssayTextForExportAdmin(userEmail);
  if (exportRes.status !== "ok" || !exportRes.text) {
    return {
      ok: false as const,
      error:
        exportRes.status === "missing"
          ? "No essay text found (complete Module 6/7 first)."
          : "Could not load essay text for export.",
    };
  }
  return { ok: true as const, text: exportRes.text, sourceModule: exportRes.sourceModule };
}
