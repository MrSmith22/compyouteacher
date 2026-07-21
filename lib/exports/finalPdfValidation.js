/**
 * Shared final-PDF validation and size display for Module 9 submission trust.
 * Server validation is authoritative; client checks are for early recovery.
 */

export const MAX_FINAL_PDF_SIZE_BYTES = 15 * 1024 * 1024;

export const FINAL_PDF_ERRORS = Object.freeze({
  EMPTY:
    "That file is empty (0 bytes). Download the PDF again from Google Docs, then select the new file.",
  TOO_LARGE: "File is too large. Maximum size is 15 MB.",
  NOT_PDF:
    "That file is not a usable PDF. Choose a file that ends in .pdf and opens as a PDF on your device.",
  MISSING: "No PDF file provided.",
});

/**
 * Human-readable size: KB for files under 1 MB so tiny valid PDFs never read as 0.0 MB.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes == null || !Number.isFinite(Number(bytes)) || Number(bytes) < 0) {
    return "Unknown size";
  }
  const n = Number(bytes);
  if (n === 0) return "0 KB";
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) {
    const kb = n / 1024;
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }
  const mb = n / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/**
 * @param {ArrayBuffer | Uint8Array | null | undefined} fileBytes
 * @returns {boolean}
 */
export function hasPdfMagicBytes(fileBytes) {
  if (!fileBytes) return false;
  const bytes =
    fileBytes instanceof Uint8Array ? fileBytes : new Uint8Array(fileBytes);
  if (bytes.length < 4) return false;
  // %PDF
  return (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

/**
 * Lightweight name/MIME hint — never sufficient alone.
 * @param {{ name?: string, type?: string }} fileLike
 * @returns {boolean}
 */
export function hasPdfNameOrMimeHint(fileLike) {
  const name = String(fileLike?.name || "").toLowerCase();
  const type = String(fileLike?.type || "").toLowerCase();
  if (name.endsWith(".pdf")) return true;
  if (type === "application/pdf") return true;
  return false;
}

/**
 * Client/server size + hint checks before reading bytes.
 * @param {{ name?: string, type?: string, size?: number }} fileLike
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateFinalPdfMetadata(fileLike) {
  if (!fileLike) {
    return { ok: false, error: FINAL_PDF_ERRORS.MISSING };
  }
  const size = Number(fileLike.size);
  if (!Number.isFinite(size) || size < 0) {
    return { ok: false, error: FINAL_PDF_ERRORS.NOT_PDF };
  }
  if (size === 0) {
    return { ok: false, error: FINAL_PDF_ERRORS.EMPTY };
  }
  if (size > MAX_FINAL_PDF_SIZE_BYTES) {
    return { ok: false, error: FINAL_PDF_ERRORS.TOO_LARGE };
  }
  if (!hasPdfNameOrMimeHint(fileLike)) {
    return { ok: false, error: FINAL_PDF_ERRORS.NOT_PDF };
  }
  return { ok: true };
}

/**
 * Authoritative payload check (size + magic bytes). Name/MIME alone cannot pass.
 * @param {{ name?: string, type?: string, size?: number, bytes?: ArrayBuffer | Uint8Array }} input
 * @returns {{ ok: true, byteLength: number } | { ok: false, error: string }}
 */
export function validateFinalPdfPayload(input) {
  const meta = validateFinalPdfMetadata(input);
  if (!meta.ok) return meta;

  const bytes = input?.bytes;
  const body =
    bytes instanceof Uint8Array
      ? bytes
      : bytes
        ? new Uint8Array(bytes)
        : null;
  const byteLength = body ? body.byteLength : Number(input.size);

  if (!Number.isFinite(byteLength) || byteLength === 0) {
    return { ok: false, error: FINAL_PDF_ERRORS.EMPTY };
  }
  if (byteLength > MAX_FINAL_PDF_SIZE_BYTES) {
    return { ok: false, error: FINAL_PDF_ERRORS.TOO_LARGE };
  }
  if (!hasPdfMagicBytes(body)) {
    return { ok: false, error: FINAL_PDF_ERRORS.NOT_PDF };
  }
  return { ok: true, byteLength };
}

/**
 * Read the first bytes of a browser File for magic-byte validation.
 * @param {Blob} file
 * @returns {Promise<Uint8Array>}
 */
export async function readPdfHeaderBytes(file) {
  const slice = file.slice(0, 8);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}
