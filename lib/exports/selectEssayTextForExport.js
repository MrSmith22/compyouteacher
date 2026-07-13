/**
 * Pure essay selection for export/verification (WP-029).
 * Priority: Module 7 final_text → Module 7 full_text → Module 6 full_text.
 */

/**
 * @param {{
 *   module7?: { final_text?: unknown, full_text?: unknown } | null,
 *   module6?: { full_text?: unknown } | null,
 *   module7Error?: boolean,
 *   module6Error?: boolean,
 * }} input
 */
export function selectEssayTextForExport({
  module7 = null,
  module6 = null,
  module7Error = false,
  module6Error = false,
} = {}) {
  const m7Final =
    module7?.final_text != null ? String(module7.final_text) : "";
  if (m7Final.trim() !== "") {
    return {
      text: m7Final,
      status: "ok",
      sourceModule: 7,
      details: "export_text_from_module_7_final_text",
    };
  }

  const m7Full = module7?.full_text != null ? String(module7.full_text) : "";
  if (m7Full.trim() !== "") {
    return {
      text: m7Full,
      status: "ok",
      sourceModule: 7,
      details: "export_text_from_module_7_full_text",
    };
  }

  const m6Text = module6?.full_text != null ? String(module6.full_text) : "";
  if (m6Text.trim() !== "") {
    return {
      text: m6Text,
      status: "ok",
      sourceModule: 6,
      details: module7Error
        ? "export_text_from_module_6_full_text_fallback_after_module_7_error"
        : "export_text_from_module_6_full_text_fallback",
    };
  }

  if (module7Error || module6Error) {
    const parts = [];
    if (module7Error) parts.push("module7_query_error");
    if (module6Error) parts.push("module6_query_error");
    return {
      text: "",
      status: "error",
      sourceModule: null,
      details: parts.join("_and_"),
    };
  }

  return {
    text: "",
    status: "missing",
    sourceModule: null,
    details: "no_text_in_module_7_or_module_6",
  };
}
