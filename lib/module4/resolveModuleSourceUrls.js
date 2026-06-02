/**
 * Resolves original speech/letter URLs the same way Module 3 does after
 * `/api/module2/sources` + T-chart `letter_url` fallback.
 */

const FALLBACK_SPEECH_SOURCE_URL =
  "https://www.archives.gov/files/press/exhibits/dream-speech.pdf";
const FALLBACK_LETTER_SOURCE_URL =
  "https://kinginstitute.stanford.edu/king-papers/documents/letter-birmingham-jail";

export function resolveModuleOriginalUrls({ module2Row, tchartRows }) {
  let letterUrlFromTchart = "";
  for (const row of tchartRows || []) {
    const u = String(row?.letter_url || "").trim();
    if (u.startsWith("https://")) {
      letterUrlFromTchart = u;
      break;
    }
  }

  const speechOriginalUrl =
    module2Row?.mlk_url?.trim() || FALLBACK_SPEECH_SOURCE_URL;
  const letterOriginalUrl =
    module2Row?.lfbj_url?.trim() ||
    letterUrlFromTchart ||
    FALLBACK_LETTER_SOURCE_URL;

  return { speechOriginalUrl, letterOriginalUrl };
}
