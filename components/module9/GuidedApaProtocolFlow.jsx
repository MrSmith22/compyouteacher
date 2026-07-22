"use client";

/**
 * WP-092 — Module 9 guided APA protocol: moves → Doc inspection → PDF → upload handoff.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import GuidedApaCanonicalModel from "@/components/module9/GuidedApaCanonicalModel";
import ModuleNinePdfDownloadVisual from "@/components/module9/ModuleNinePdfDownloadVisual";
import {
  listGuidedApaMoves,
  getGuidedApaMove,
  listGuidedApaPdfInspectionItems,
  GUIDED_APA_PDF_DOWNLOAD_STEPS,
} from "@/lib/module9/guidedApaMoves";
import {
  labelForGuidedApaRuleKind,
  getMlkGuidedApaRequirementsContract,
} from "@/lib/module9/guidedApaRequirementsContract";
import {
  normalizeGuidedApaProtocolState,
  setGuidedApaMoveStatus,
  areFormattingMovesComplete,
  isDocInspectionComplete,
  attachLegacyGuidedApaHistory,
  getFirstIncompleteGuidedApaMoveId,
  resolveGuidedApaPhase,
} from "@/lib/module9/guidedApaProtocolState";

async function loadProtocolState() {
  try {
    const res = await fetch("/api/module9/guided-apa-protocol");
    const json = await res.json().catch(() => ({}));
    if (res.status === 503) {
      return { ok: false, schemaMissing: true, error: json?.error };
    }
    if (!res.ok || !json?.ok) {
      return { ok: false, error: json?.error || `HTTP ${res.status}` };
    }
    return { ok: true, state: json.state, exists: json.exists };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function saveProtocolState(state) {
  try {
    const res = await fetch("/api/module9/guided-apa-protocol", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) {
      return { ok: false, error: json?.error || `HTTP ${res.status}`, schemaMissing: res.status === 503 };
    }
    return { ok: true, state: json.state, stale: Boolean(json.stale) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export default function GuidedApaProtocolFlow({
  exportUrl,
  docReady,
  docVerifiedAt = null,
  verificationSignature = null,
  authoritativeDocId = null,
  onOpenDoc,
  onNeedDocRecovery,
  legacyChecklistItems = null,
  legacyQuiz = null,
  // PDF / upload — reuse parent handlers
  pdfFile,
  pdfError,
  uploading,
  uploadError,
  onPdfSelected,
  onClearPdf,
  onUpload,
  finalUploadChecklistState,
  onToggleFinalUploadItem,
  canUpload,
  alreadySubmitted = false,
  onViewReceipt,
}) {
  const [phase, setPhase] = useState("handoff"); // handoff | move | doc_inspection | pdf
  const [state, setState] = useState(() => normalizeGuidedApaProtocolState(null));
  const [ready, setReady] = useState(false);
  const [persistError, setPersistError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideSection, setGuideSection] = useState("page_setup");
  const saveTimer = useRef(null);
  const hydrated = useRef(false);
  /** Skip the first post-hydrate autosave so soft navigations cannot overwrite fresher server rows. */
  const skipNextAutosave = useRef(true);
  const contract = useMemo(() => getMlkGuidedApaRequirementsContract(), []);
  const moves = useMemo(() => listGuidedApaMoves(), []);
  const pdfItems = useMemo(() => listGuidedApaPdfInspectionItems(), []);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    (async () => {
      const loaded = await loadProtocolState();
      let next = normalizeGuidedApaProtocolState(loaded.state);
      next = attachLegacyGuidedApaHistory(next, {
        module9Items: legacyChecklistItems,
        module9Quiz: legacyQuiz,
      });
      if (authoritativeDocId) next.authoritativeDocId = authoritativeDocId;
      if (verificationSignature) next.verificationSignature = verificationSignature;
      if (docVerifiedAt) next.verificationCheckedAt = docVerifiedAt;
      const incomplete = getFirstIncompleteGuidedApaMoveId(next);
      if (!areFormattingMovesComplete(next) && incomplete) {
        next = { ...next, activeMoveId: incomplete };
      }
      const nextPhase = resolveGuidedApaPhase({
        alreadySubmitted,
        docReady,
        state: next,
      });
      skipNextAutosave.current = true;
      setState(next);
      setPhase(nextPhase);
      if (loaded.schemaMissing) {
        setPersistError(
          "Guided formatting progress could not load from the server yet. Work on this device may not survive a new browser."
        );
      } else if (!loaded.ok && loaded.error) {
        setPersistError(
          "Could not load saved formatting progress. Showing a fresh start — tap Retry save after you confirm a move."
        );
      }
      setReady(true);
    })();
  }, [
    alreadySubmitted,
    authoritativeDocId,
    docReady,
    docVerifiedAt,
    legacyChecklistItems,
    legacyQuiz,
    verificationSignature,
  ]);

  // When Doc verification arrives after first paint, advance off handoff without
  // replaying a completed protocol back into the move list.
  useEffect(() => {
    if (!ready) return;
    setPhase((current) => {
      const next = resolveGuidedApaPhase({
        alreadySubmitted,
        docReady,
        state,
      });
      // Preserve an intentional return to a needs-help move from Doc inspection.
      if (
        current === "move" &&
        next === "doc_inspection" &&
        state?.returnMoveId &&
        state?.moves?.[state.returnMoveId]?.status === "needs_help"
      ) {
        return current;
      }
      return next;
    });
  }, [ready, alreadySubmitted, docReady, state]);

  useEffect(() => {
    if (!ready) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const saved = await saveProtocolState(state);
      if (!saved.ok) {
        setPersistError(
          "Could not save formatting progress. Your current answers are still on screen — tap Retry save."
        );
      } else {
        setPersistError("");
        // Adopt server row on stale rejection; avoid looping setState on identical writes.
        if (saved.stale && saved.state) {
          setState(normalizeGuidedApaProtocolState(saved.state));
          skipNextAutosave.current = true;
        } else if (
          saved.state?.updatedAt &&
          saved.state.updatedAt !== state.updatedAt
        ) {
          setState(normalizeGuidedApaProtocolState(saved.state));
          skipNextAutosave.current = true;
        }
      }
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, ready]);

  const activeMove = getGuidedApaMove(state.activeMoveId) || moves[0];
  const progress = moves.filter(
    (m) =>
      m.id !== "doc_inspection" &&
      ["looks_correct", "fixed", "not_applicable"].includes(
        state.moves[m.id]?.status
      )
  ).length;
  const totalMoves = moves.filter((m) => m.id !== "doc_inspection").length;

  const confirmMove = (status) => {
    setState((prev) =>
      setGuidedApaMoveStatus(prev, activeMove.id, status, {
        docSignature: verificationSignature,
        helpCode: status === "needs_help" ? "student_requested_fix" : null,
      })
    );
    if (status === "looks_correct" || status === "fixed") {
      const preview = setGuidedApaMoveStatus(state, activeMove.id, status, {
        docSignature: verificationSignature,
      });
      if (areFormattingMovesComplete(preview)) {
        setPhase("doc_inspection");
      }
    }
  };

  const retrySave = async () => {
    const saved = await saveProtocolState(state);
    if (!saved.ok) {
      setPersistError("Still could not save. Check your connection and try again.");
    } else {
      setPersistError("");
      if (saved.state) setState(normalizeGuidedApaProtocolState(saved.state));
    }
  };

  if (!ready) {
    return <p className="p-4 text-sm text-theme-muted">Loading formatting protocol…</p>;
  }

  if (alreadySubmitted) {
    return (
      <section className="space-y-3 rounded-xl border border-theme-light bg-white p-4">
        <h2 className="text-lg font-semibold">Submission already received</h2>
        <p className="text-sm text-theme-muted">
          Your durable receipt is the source of truth. You do not need to repeat formatting.
        </p>
        <button
          type="button"
          className="min-h-[44px] rounded-lg bg-theme-blue px-4 py-2 text-white"
          onClick={onViewReceipt}
        >
          View submission receipt
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-4" data-testid="guided-apa-protocol-flow">
      {persistError ? (
        <div
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="status"
        >
          <p>{persistError}</p>
          <button
            type="button"
            className="mt-2 min-h-[44px] rounded bg-theme-blue px-3 py-1.5 text-white"
            onClick={retrySave}
            data-testid="guided-apa-retry-save"
          >
            Retry save
          </button>
        </div>
      ) : null}

      {/* Handoff when Doc not ready */}
      {phase === "handoff" || !docReady ? (
        <section
          className="space-y-3 rounded-xl border-2 border-theme-blue/30 bg-white p-4"
          data-testid="guided-apa-doc-handoff"
        >
          <h2 className="text-xl font-semibold text-theme-dark">
            Format your Google Doc for this assignment
          </h2>
          <p className="text-sm text-theme-muted">
            Module 8 prepares one verified Google Doc with your newest essay. Open or
            repair that Doc, then start the first formatting move.
          </p>
          {exportUrl ? (
            <p className="text-sm">
              Doc link is available
              {docVerifiedAt
                ? ` · last checked ${new Date(docVerifiedAt).toLocaleString()}`
                : ""}
              .
            </p>
          ) : (
            <p className="text-sm text-amber-800">
              No verified submission Doc yet. Use recovery to create or update it.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-[44px] rounded-lg border border-theme-blue px-4 py-2 text-theme-blue"
              onClick={onOpenDoc}
              disabled={!exportUrl}
            >
              Open Google Doc
            </button>
            <button
              type="button"
              className="min-h-[44px] rounded-lg bg-theme-blue px-4 py-2 text-white"
              onClick={onNeedDocRecovery}
              data-testid="guided-apa-need-recovery"
            >
              Fix or update Google Doc
            </button>
            <button
              type="button"
              className="min-h-[44px] rounded-lg bg-theme-dark px-4 py-2 text-white disabled:bg-gray-400"
              disabled={!docReady}
              onClick={() => {
                const nextPhase = resolveGuidedApaPhase({
                  alreadySubmitted,
                  docReady: true,
                  state,
                });
                if (nextPhase === "move") {
                  const incomplete = getFirstIncompleteGuidedApaMoveId(state);
                  setState((prev) => ({
                    ...prev,
                    activeMoveId:
                      incomplete || prev.activeMoveId || "page_setup",
                  }));
                }
                setPhase(nextPhase);
              }}
              data-testid="guided-apa-start-moves"
            >
              Start formatting
            </button>
          </div>
        </section>
      ) : null}

      {docReady && phase === "move" ? (
        <section
          className="space-y-4 rounded-xl border-2 border-theme-blue/30 bg-white p-4"
          data-testid="guided-apa-active-move"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-blue">
                Formatting move · {progress} of {totalMoves} complete
              </p>
              <h2 className="text-xl font-semibold text-theme-dark">
                {activeMove.title}
              </h2>
              <p className="text-xs text-theme-muted">
                {labelForGuidedApaRuleKind(activeMove.ruleKind)}
              </p>
            </div>
            <button
              type="button"
              className="min-h-[44px] text-sm text-theme-blue underline"
              onClick={onOpenDoc}
            >
              Open Google Doc
            </button>
          </div>

          <ol className="flex flex-wrap gap-2 text-xs text-theme-muted" aria-label="Completed moves">
            {moves
              .filter((m) => m.id !== "doc_inspection")
              .map((m) => {
                const st = state.moves[m.id]?.status;
                const done = ["looks_correct", "fixed", "not_applicable"].includes(st);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      className={`rounded-full border px-2 py-1 ${
                        m.id === activeMove.id
                          ? "border-theme-blue bg-theme-blue/10 text-theme-dark"
                          : done
                            ? "border-theme-light text-theme-muted"
                            : st === "needs_help"
                              ? "border-amber-400 text-amber-900"
                              : "border-theme-light"
                      }`}
                      onClick={() =>
                        setState((prev) => ({ ...prev, activeMoveId: m.id }))
                      }
                    >
                      {done ? "✓ " : st === "needs_help" ? "! " : ""}
                      {m.title}
                    </button>
                  </li>
                );
              })}
          </ol>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">See it</h3>
                <p className="text-sm text-theme-muted">{activeMove.see}</p>
              </div>
              <GuidedApaCanonicalModel
                activeLocusId={activeMove.modelLocusId}
                compact
              />
              <div>
                <h3 className="text-sm font-semibold">Understand it</h3>
                <p className="text-sm text-theme-muted">{activeMove.understand}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Do it</h3>
                {activeMove.environmentNote ? (
                  <p className="mb-1 text-xs text-theme-muted">
                    {activeMove.environmentNote}
                  </p>
                ) : null}
                <ol className="list-decimal space-y-1 pl-5 text-sm">
                  {activeMove.doSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Check it</h3>
                <p className="text-sm text-theme-muted">{activeMove.check}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Fix it</h3>
                <p className="text-sm text-theme-muted">{activeMove.fix}</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className="min-h-[44px] rounded-lg bg-theme-blue px-4 py-2 text-white"
                  onClick={() => confirmMove("looks_correct")}
                  data-testid="guided-apa-looks-correct"
                >
                  Looks correct
                </button>
                <button
                  type="button"
                  className="min-h-[44px] rounded-lg border border-amber-500 px-4 py-2 text-amber-900"
                  onClick={() => confirmMove("needs_help")}
                  data-testid="guided-apa-needs-help"
                >
                  Help me fix it
                </button>
                {state.moves[activeMove.id]?.status === "needs_help" ? (
                  <button
                    type="button"
                    className="min-h-[44px] rounded-lg bg-theme-dark px-4 py-2 text-white"
                    onClick={() => confirmMove("fixed")}
                    data-testid="guided-apa-fixed"
                  >
                    I fixed it
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <details
            className="rounded-lg border border-theme-light px-3 py-2 text-sm"
            open={guideOpen}
            onToggle={(e) => setGuideOpen(e.currentTarget.open)}
          >
            <summary className="cursor-pointer font-medium">
              Full formatting guide (closed by default)
            </summary>
            <div className="mt-2 space-y-2">
              <label className="block text-xs text-theme-muted">
                Jump to section
                <select
                  className="mt-1 w-full rounded border border-theme-light px-2 py-1"
                  value={guideSection}
                  onChange={(e) => setGuideSection(e.target.value)}
                >
                  {moves.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </label>
              {(() => {
                const g = getGuidedApaMove(guideSection);
                if (!g) return null;
                return (
                  <div className="space-y-1" data-testid="guided-apa-guide-section">
                    <p className="font-medium">{g.title}</p>
                    <p className="text-theme-muted">{g.understand}</p>
                    <ol className="list-decimal pl-5">
                      {g.doSteps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  </div>
                );
              })()}
              <ul className="space-y-1 text-xs text-theme-muted">
                {contract.externalReferences.map((r) => (
                  <li key={r.id}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-theme-blue underline"
                    >
                      {r.label}
                    </a>
                    {" — "}
                    {r.purpose}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </section>
      ) : null}

      {docReady && phase === "doc_inspection" ? (
        <section
          className="space-y-4 rounded-xl border-2 border-theme-blue/30 bg-white p-4"
          data-testid="guided-apa-doc-inspection"
        >
          <h2 className="text-xl font-semibold">Final Google Doc inspection</h2>
          <p className="text-sm text-theme-muted">
            This is the only definitive formatting review of your Google Doc. Check the
            beginning, a body page, citations, and the References page.
          </p>
          <GuidedApaCanonicalModel activeLocusId="locus-whole-paper" />
          <ul className="space-y-2 text-sm">
            {moves
              .filter((m) => m.id !== "doc_inspection")
              .map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-theme-light px-3 py-2"
                >
                  <span>{m.title}</span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      className="min-h-[40px] rounded bg-theme-blue px-3 text-white text-xs"
                      onClick={() => {
                        setState((prev) =>
                          setGuidedApaMoveStatus(prev, m.id, "looks_correct", {
                            docSignature: verificationSignature,
                          })
                        );
                      }}
                    >
                      Looks correct
                    </button>
                    <button
                      type="button"
                      className="min-h-[40px] rounded border border-amber-500 px-3 text-xs text-amber-900"
                      onClick={() => {
                        setState((prev) => ({
                          ...setGuidedApaMoveStatus(prev, m.id, "needs_help"),
                          activeMoveId: m.id,
                        }));
                        setPhase("move");
                      }}
                    >
                      Help me fix it
                    </button>
                  </span>
                </li>
              ))}
          </ul>
          <button
            type="button"
            className="min-h-[44px] rounded-lg bg-theme-dark px-4 py-2 text-white"
            data-testid="guided-apa-doc-inspection-done"
            onClick={() => {
              setState((prev) =>
                setGuidedApaMoveStatus(prev, "doc_inspection", "looks_correct", {
                  docSignature: verificationSignature,
                })
              );
              setPhase("pdf");
            }}
          >
            Doc inspection complete — continue to PDF
          </button>
        </section>
      ) : null}

      {docReady && phase === "pdf" ? (
        <section
          className="space-y-4 rounded-xl border-2 border-theme-blue/30 bg-white p-4"
          data-testid="guided-apa-pdf-phase"
        >
          <h2 className="text-xl font-semibold">Download, inspect, and upload your PDF</h2>
          <p className="text-sm font-medium text-theme-dark">
            You checked your Google Doc earlier. Now check that the downloaded PDF still
            looks correct.
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {GUIDED_APA_PDF_DOWNLOAD_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <ModuleNinePdfDownloadVisual />
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Select your PDF
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="mt-1 block w-full text-sm"
                onChange={(e) => onPdfSelected?.(e.target.files?.[0] || null)}
                data-testid="guided-apa-pdf-input"
              />
            </label>
            {pdfFile ? (
              <button
                type="button"
                className="text-sm text-theme-blue underline"
                onClick={onClearPdf}
              >
                Clear selected file
              </button>
            ) : null}
            {pdfError ? (
              <p className="text-sm text-red-700" role="alert">
                {pdfError}
              </p>
            ) : null}
          </div>
          <fieldset className="space-y-2" disabled={!pdfFile}>
            <legend className="text-sm font-semibold">PDF inspection</legend>
            {pdfItems.map((item, index) => (
              <label key={item.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={Boolean(finalUploadChecklistState?.[index])}
                  onChange={() => onToggleFinalUploadItem?.(index)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </fieldset>
          {uploadError ? (
            <p className="text-sm text-red-700" role="alert">
              {uploadError}
            </p>
          ) : null}
          <button
            type="button"
            className="min-h-[44px] rounded-lg bg-theme-blue px-4 py-2 text-white disabled:bg-gray-400"
            disabled={!canUpload || uploading}
            onClick={onUpload}
            data-testid="guided-apa-upload"
          >
            {uploading ? "Uploading…" : "Upload final PDF"}
          </button>
        </section>
      ) : null}
    </div>
  );
}
