const AUD_MARKER = "---AUDIENCE---";
const PUR_MARKER = "---PURPOSE---";

/**
 * Parse Module 2 `tchart_entries.observation` when stored as:
 *   main explanation
 *   ---AUDIENCE---
 *   audience effect text
 *   ---PURPOSE---
 *   purpose connection text
 * Markers may appear in either order; missing sections return empty strings.
 */
export function parseModule2Observation(raw) {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) {
    return { main: "", audience: "", purpose: "" };
  }

  const audIdx = text.indexOf(AUD_MARKER);
  const purIdx = text.indexOf(PUR_MARKER);

  if (audIdx === -1 && purIdx === -1) {
    return { main: text, audience: "", purpose: "" };
  }

  if (audIdx !== -1 && purIdx !== -1) {
    if (audIdx < purIdx) {
      return {
        main: text.slice(0, audIdx).trim(),
        audience: text.slice(audIdx + AUD_MARKER.length, purIdx).trim(),
        purpose: text.slice(purIdx + PUR_MARKER.length).trim(),
      };
    }
    return {
      main: text.slice(0, purIdx).trim(),
      purpose: text.slice(purIdx + PUR_MARKER.length, audIdx).trim(),
      audience: text.slice(audIdx + AUD_MARKER.length).trim(),
    };
  }

  if (audIdx !== -1) {
    return {
      main: text.slice(0, audIdx).trim(),
      audience: text.slice(audIdx + AUD_MARKER.length).trim(),
      purpose: "",
    };
  }

  return {
    main: text.slice(0, purIdx).trim(),
    audience: "",
    purpose: text.slice(purIdx + PUR_MARKER.length).trim(),
  };
}
