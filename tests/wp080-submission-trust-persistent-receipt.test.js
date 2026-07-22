/**
 * WP-080 — Submission trust: PDF validation, durable receipt, dashboard sync.
 * Mixes executable validation/idempotency behavior with architecture contracts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  FINAL_PDF_ERRORS,
  formatFileSize,
  hasPdfMagicBytes,
  validateFinalPdfMetadata,
  validateFinalPdfPayload,
} from "../lib/exports/finalPdfValidation.js";
import { ensureModuleCompletedActivity } from "../lib/supabase/helpers/ensureModuleCompletedActivity.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

/** Minimal valid PDF bytes (%PDF…%%EOF) without importing TypeScript seed helpers. */
function buildTinyValidPdf(label = "Tiny essay") {
  const stream = `BT /F1 12 Tf 50 750 Td (${label.replace(/[()\\]/g, "")}) Tj ET`;
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj",
    `4 0 obj<< /Length ${Buffer.byteLength(stream)} >>stream\n${stream}\nendstream endobj`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${obj}\n`;
  }
  const xrefStart = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(pdf, "utf8"));
}

const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4

function createActivityLogMock({ existingId = null, insertFails = false } = {}) {
  const inserts = [];
  const rows = existingId ? [{ id: existingId }] : [];

  return {
    inserts,
    from(table) {
      assert.equal(table, "student_activity_log");
      const filters = {};
      const api = {
        select() {
          return api;
        },
        eq(col, val) {
          filters[col] = val;
          return api;
        },
        limit() {
          return api;
        },
        async maybeSingle() {
          if (filters.action === "module_completed") {
            const match = rows.find(
              () =>
                filters.user_email &&
                filters.action === "module_completed" &&
                filters.module != null
            );
            return { data: match || null, error: null };
          }
          return { data: rows[0] || null, error: null };
        },
        insert(payload) {
          inserts.push(payload);
          return {
            select() {
              return {
                async maybeSingle() {
                  if (insertFails) {
                    return { data: null, error: { message: "duplicate" } };
                  }
                  const id = `new_${inserts.length}`;
                  rows.push({ id });
                  return { data: { id }, error: null };
                },
              };
            },
          };
        },
      };
      return api;
    },
  };
}

describe("WP-080 submission trust and persistent receipt", () => {
  it("formats tiny valid PDFs in KB instead of 0.0 MB", () => {
    assert.equal(formatFileSize(512), "512 bytes");
    assert.equal(formatFileSize(4 * 1024), "4.0 KB");
    assert.equal(formatFileSize(48 * 1024), "48 KB");
    assert.notEqual(formatFileSize(48 * 1024), "0.0 MB");
    assert.equal(formatFileSize(2.5 * 1024 * 1024), "2.5 MB");
    assert.equal(formatFileSize(0), "0 KB");
  });

  it("rejects zero-byte and non-PDF payloads with student-readable errors", () => {
    assert.deepEqual(validateFinalPdfMetadata({ name: "x.pdf", type: "application/pdf", size: 0 }), {
      ok: false,
      error: FINAL_PDF_ERRORS.EMPTY,
    });
    assert.deepEqual(
      validateFinalPdfMetadata({ name: "notes.txt", type: "text/plain", size: 1200 }),
      { ok: false, error: FINAL_PDF_ERRORS.NOT_PDF }
    );
    assert.equal(
      validateFinalPdfPayload({
        name: "fake.pdf",
        type: "application/pdf",
        size: 8,
        bytes: new TextEncoder().encode("not-a-pdf"),
      }).ok,
      false
    );
    assert.equal(hasPdfMagicBytes(PDF_MAGIC), true);
    assert.equal(
      validateFinalPdfPayload({
        name: "essay.pdf",
        type: "application/pdf",
        size: PDF_MAGIC.byteLength,
        bytes: PDF_MAGIC,
      }).ok,
      true
    );
  });

  it("accepts a real tiny seeded PDF and rejects empty / wrong-type files", () => {
    const tinyPdf = buildTinyValidPdf("Tiny essay for trust check.");
    assert.ok(tinyPdf.byteLength > 0 && tinyPdf.byteLength < 50 * 1024);
    assert.ok(hasPdfMagicBytes(tinyPdf));
    assert.match(formatFileSize(tinyPdf.byteLength), /(bytes|KB)$/);
    assert.equal(formatFileSize(tinyPdf.byteLength).includes("0.0 MB"), false);

    const ok = validateFinalPdfPayload({
      name: "tiny.pdf",
      type: "application/pdf",
      size: tinyPdf.byteLength,
      bytes: tinyPdf,
    });
    assert.equal(ok.ok, true);

    const empty = validateFinalPdfPayload({
      name: "empty.pdf",
      type: "application/pdf",
      size: 0,
      bytes: new Uint8Array(0),
    });
    assert.equal(empty.ok, false);
    assert.equal(empty.error, FINAL_PDF_ERRORS.EMPTY);

    const wrong = validateFinalPdfPayload({
      name: "essay.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 1200,
      bytes: new TextEncoder().encode("PK\u0003\u0004not-a-pdf-body"),
    });
    assert.equal(wrong.ok, false);
    assert.equal(wrong.error, FINAL_PDF_ERRORS.NOT_PDF);
  });

  it("ensureModuleCompletedActivity is idempotent across repeated receipt loads", async () => {
    const firstStore = createActivityLogMock();
    const first = await ensureModuleCompletedActivity({
      supabase: firstStore,
      userEmail: "student@example.com",
      moduleNumber: 9,
      metadata: { source: "final_pdf_success_page" },
    });
    assert.equal(first.ok, true);
    assert.equal(first.alreadyLogged, false);
    assert.equal(firstStore.inserts.length, 1);

    const secondStore = createActivityLogMock({ existingId: first.id || "row_1" });
    const second = await ensureModuleCompletedActivity({
      supabase: secondStore,
      userEmail: "student@example.com",
      moduleNumber: 9,
      metadata: { source: "final_pdf_success_page" },
    });
    assert.equal(second.ok, true);
    assert.equal(second.alreadyLogged, true);
    assert.equal(secondStore.inserts.length, 0);
  });

  it("does not accept extension alone without PDF content on the server path", () => {
    const api = readSrc("app/api/final-pdf/route.js");
    const upload = readSrc("lib/exports/uploadFinalPdf.ts");
    const activity = readSrc("app/api/activity/log/route.ts");
    assert.ok(api.includes("validateFinalPdfPayload"));
    assert.ok(api.includes("validateFinalPdfMetadata"));
    assert.ok(upload.includes("validateFinalPdfPayload"));
    assert.ok(upload.includes("file_size: fileSize"));
    assert.ok(api.includes("status: 400"));
    assert.ok(activity.includes('action === "module_completed"'));
    assert.ok(activity.includes("alreadyLogged"));
  });

  it("stores file_size and receipt fields only after durable upload success", () => {
    const upload = readSrc("lib/exports/uploadFinalPdf.ts");
    const validateIdx = upload.indexOf("validateFinalPdfPayload");
    const storageIdx = upload.indexOf("storage.from(BUCKET).upload");
    const insertIdx = upload.indexOf(".insert({");
    assert.ok(validateIdx > 0 && storageIdx > validateIdx && insertIdx > storageIdx);
    assert.ok(upload.includes("file_size: fileSize"));
    assert.ok(upload.includes("remove([path])"));
    assert.ok(upload.includes("Save failed"));
    assert.ok(
      upload.includes("file_size migration is not applied") ||
        /file_size/i.test(upload)
    );
  });

  it("Module 9 shows KB selection and never flashes local receipt before navigate", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes("formatFileSize(pdfFile.size)"));
    assert.ok(m9.includes("validateFinalPdfMetadata"));
    assert.ok(m9.includes("validateFinalPdfPayload"));
    assert.ok(m9.includes("readPdfHeaderBytes"));
    assert.ok(m9.includes('router.push("/modules/9/success")'));

    const uploadFn = m9.slice(
      m9.indexOf("const handleUploadPDF"),
      m9.indexOf("if (!session) return")
    );
    assert.equal(
      /setFinalPdfRow\(/.test(uploadFn),
      false,
      "upload success must not set finalPdfRow before redirect"
    );
    assert.ok(uploadFn.includes('router.push("/modules/9/success")'));
    assert.ok(m9.includes('data-testid="module9-upload-progress"'));
  });

  it("success page is a durable receipt with recovery when missing", () => {
    const success = readSrc("app/modules/9/success/page.js");
    assert.ok(success.includes('data-testid="module9-submission-receipt"'));
    assert.ok(success.includes('data-testid="module9-receipt-details"'));
    assert.ok(success.includes('data-testid="module9-receipt-filename"'));
    assert.ok(success.includes('data-testid="module9-receipt-submitted-at"'));
    assert.ok(success.includes('data-testid="module9-receipt-file-size"'));
    assert.ok(success.includes('data-testid="module9-receipt-id"'));
    assert.ok(success.includes('journeyTrailTestId="module9-accomplishment-trail"'));
    assert.ok(success.includes("SuccessExperienceShell"));
    assert.ok(success.includes("buildModule9ReceiptExperience"));
    assert.ok(success.includes("formatFileSize"));
    assert.ok(success.includes('data-testid="module9-receipt-missing"'));
    assert.ok(success.includes("Contact your teacher before you try to change or resubmit"));
    assert.ok(success.includes("advanceCurrentModuleOnSuccess"));
    assert.ok(success.includes("logActivity"));
    assert.ok(success.includes("getStudentExport"));
    assert.ok(success.includes("idempotent") || success.includes("module_completed"));

    const contract = readSrc("lib/ui/successExperienceContract.js");
    assert.ok(contract.includes("Your paper was received"));
    assert.ok(contract.includes("Back to Module 9 upload") || contract.includes("/modules/9"));
    assert.ok(contract.includes('href: "/dashboard"'));

    const loadStart = success.indexOf("async function onLoad");
    const loadEnd = success.indexOf("onLoad();");
    const onLoad = success.slice(loadStart, loadEnd);
    const fetchIdx = onLoad.indexOf("getStudentExport");
    const advanceIdx = onLoad.indexOf("advanceCurrentModuleOnSuccess");
    const completedIdx = onLoad.indexOf("module_completed");
    assert.ok(fetchIdx > 0 && advanceIdx > fetchIdx && completedIdx > fetchIdx);
    assert.ok(onLoad.includes("receiptOk"));
  });

  it("dashboard shows one completion indicator plus submitted timestamp", () => {
    const dash = readSrc("app/dashboard/page.js");
    const foundation = readSrc("components/success/CompletedDashboardFoundation.jsx");
    assert.ok(dash.includes("getFinalPdfExport"));
    assert.ok(dash.includes("CompletedDashboardFoundation"));
    assert.ok(foundation.includes('data-testid="dashboard-open-final-pdf"'));
    assert.ok(foundation.includes('data-testid="dashboard-view-receipt"'));
    assert.ok(foundation.includes('data-testid="dashboard-submission-time"'));
    assert.ok(dash.includes("uploaded_at"));
    assert.ok(foundation.includes('data-testid="dashboard-essay-completed-badge"'));
    assert.ok(dash.includes('router.push("/modules/9/success")') || dash.includes('onOpenReceipt'));
    assert.ok(dash.includes("DevResetStudentButton"));
  });

  it("migration adds file_size for receipt persistence", () => {
    const migration = readSrc(
      "supabase/migrations/20260720210000_student_exports_file_size.sql"
    );
    assert.ok(/file_size/i.test(migration));
    assert.ok(/student_exports/i.test(migration));
    assert.ok(/add column if not exists/i.test(migration));
  });
});
