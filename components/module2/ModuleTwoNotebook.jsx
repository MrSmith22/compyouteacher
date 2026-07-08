import Panel from "@/components/ui/Panel";

function previewText(value, max = 110) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function buildTChartItems({ formData, appealLabels }) {
  if (!formData) return [];
  const appeals = Object.keys(formData);
  const items = [];

  for (const appeal of appeals) {
    const d = formData[appeal];
    if (!d) continue;
    const appealLabel = appealLabels?.[appeal] ?? appeal;

    if (nonEmpty(d.speechQuote)) {
      items.push({
        key: `${appeal}:speech`,
        label: `${appealLabel} • Speech`,
        quote: previewText(d.speechQuote),
        note: previewText(d.speechWhy, 90),
      });
    }

    if (nonEmpty(d.letterQuote)) {
      items.push({
        key: `${appeal}:letter`,
        label: `${appealLabel} • Letter`,
        quote: previewText(d.letterQuote),
        note: previewText(d.letterWhy, 90),
      });
    }
  }

  return items;
}

function buildGuidedObservationItems({ savedBySourceId, passageMetaById }) {
  if (!savedBySourceId) return [];
  const rows = Object.values(savedBySourceId).filter(Boolean);
  const items = [];

  for (const row of rows) {
    const passage = passageMetaById?.[row.source_id] ?? null;
    items.push({
      key: row.source_id,
      label: passage?.rhetoricalStrategyLabel
        ? `${passage.rhetoricalStrategyLabel}`
        : "Observation",
      quote: previewText(row.quote, 90),
      note: previewText(row.student_observation, 110),
    });
  }

  return items;
}

export default function ModuleTwoNotebook({
  sources,
  sourceTitles,
  guided,
  tcharts,
}) {
  const hasSources =
    Boolean(sources?.speechUrl) ||
    Boolean(sources?.letterUrl) ||
    Boolean(guided?.sources?.speechUrl) ||
    Boolean(guided?.sources?.letterUrl);

  const guidedItems = buildGuidedObservationItems({
    savedBySourceId: guided?.savedBySourceId,
    passageMetaById: guided?.passageMetaById,
  });

  const tchartItems = buildTChartItems({
    formData: tcharts?.formData,
    appealLabels: tcharts?.appealLabels,
  });

  const hasContent = hasSources || guidedItems.length > 0 || tchartItems.length > 0;

  if (!hasContent) {
    return (
      <Panel className="border border-theme-dark/10 bg-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-theme-dark/55">
          My notebook
        </p>
        <p className="mt-2 text-sm text-theme-dark/75">
          As you save work, it will quietly collect here.
        </p>
      </Panel>
    );
  }

  const speechTitle =
    sourceTitles?.speechTitle || sourceTitles?.speech || "Speech";
  const letterTitle =
    sourceTitles?.letterTitle || sourceTitles?.letter || "Letter";

  const mySpeechUrl = sources?.speechUrl || guided?.sources?.speechUrl || "";
  const myLetterUrl = sources?.letterUrl || guided?.sources?.letterUrl || "";

  const showSources = Boolean(mySpeechUrl) || Boolean(myLetterUrl);
  const showGuided = guidedItems.length > 0;
  const showTcharts = tchartItems.length > 0;

  return (
    <Panel className="border border-theme-dark/10 bg-white">
      <div className="text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-theme-dark/55">
          My notebook
        </p>
        <p className="mt-1 text-sm text-theme-dark/75">
          What I’ve collected so far
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {showSources ? (
          <section className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-dark/55">
              My sources
            </p>
            <ul className="space-y-2 text-sm text-theme-dark/75">
              {mySpeechUrl ? (
                <li>
                  <span className="font-medium text-theme-dark">{speechTitle}</span>
                </li>
              ) : null}
              {myLetterUrl ? (
                <li>
                  <span className="font-medium text-theme-dark">{letterTitle}</span>
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}

        {showGuided ? (
          <section className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-dark/55">
              My observations
            </p>
            <ul className="space-y-3">
              {guidedItems.slice(0, 4).map((item) => (
                <li key={item.key} className="space-y-1">
                  <p className="text-sm font-medium text-theme-dark/85">
                    {item.label}
                  </p>
                  {item.note ? (
                    <p className="text-sm text-theme-dark/70 italic">
                      &ldquo;{item.note}&rdquo;
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {guidedItems.length > 4 ? (
              <p className="text-xs text-theme-dark/55">
                And {guidedItems.length - 4} more…
              </p>
            ) : null}
          </section>
        ) : null}

        {showTcharts ? (
          <section className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-dark/55">
              My quotes
            </p>
            <ul className="space-y-3">
              {tchartItems.slice(0, 4).map((item) => (
                <li key={item.key} className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-theme-dark/55">
                    {item.label}
                  </p>
                  {item.quote ? (
                    <p className="text-sm text-theme-dark/75 italic">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                  ) : null}
                  {item.note ? (
                    <p className="text-sm text-theme-dark/70">
                      {item.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {tchartItems.length > 4 ? (
              <p className="text-xs text-theme-dark/55">
                And {tchartItems.length - 4} more…
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </Panel>
  );
}

