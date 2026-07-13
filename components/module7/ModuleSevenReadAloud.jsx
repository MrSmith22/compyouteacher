export default function ModuleSevenReadAloud({
  recording,
  audioURL,
  devices,
  selectedDeviceId,
  amp,
  locked,
  onDeviceChange,
  onStart,
  onStop,
  prominent = false,
  checklist = null,
}) {
  const listenItems = Array.isArray(checklist) ? checklist.filter(Boolean) : [];

  const controls = (
    <div className="space-y-4 text-left" data-testid="module7-read-aloud-recorder">
      {prominent ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-primary">Record and play back</p>
          <p className="text-sm leading-relaxed text-text-muted">
            Record while you read the essay above, then play it back.
          </p>
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-text-muted">
          Hearing your sentences helps you notice stumbles, repetition, abrupt
          transitions, and places that need explanation.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {!recording ? (
          <button
            type="button"
            onClick={onStart}
            disabled={locked}
            className={[
              "rounded-lg bg-theme-red font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-dark",
              prominent ? "min-h-[44px] px-6 py-3 text-base" : "min-h-[44px] px-4 py-2 text-sm",
            ].join(" ")}
          >
            Start read-aloud
          </button>
        ) : (
          <button
            type="button"
            onClick={onStop}
            className={[
              "rounded-lg bg-yellow-500 font-semibold text-white shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-dark",
              prominent ? "min-h-[44px] px-6 py-3 text-base" : "min-h-[44px] px-4 py-2 text-sm",
            ].join(" ")}
          >
            Stop recording
          </button>
        )}
      </div>

      {listenItems.length > 0 ? (
        <div
          className="rounded-lg border border-border-soft/70 bg-white/90 px-3 py-3"
          data-testid="module7-listen-checklist"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Listen for
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-primary">
            {listenItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="text-xs font-medium text-text-muted" htmlFor="module7-mic-select">
          Microphone
        </label>
        <select
          id="module7-mic-select"
          className="min-h-[44px] rounded-lg border border-border-soft bg-white px-2 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2"
          value={selectedDeviceId}
          onChange={onDeviceChange}
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Mic ${d.deviceId.slice(0, 6)}…`}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Input level</span>
          <div
            className="h-2 w-32 overflow-hidden rounded bg-border-soft/60"
            title="live input amplitude"
          >
            <div
              className="h-2 bg-theme-green"
              style={{ width: `${Math.min(100, Math.round(amp))}%` }}
            />
          </div>
        </div>
      </div>

      {audioURL ? (
        <div className="space-y-2" data-testid="module7-read-aloud-playback">
          <p className="text-sm font-medium text-text-primary">Your recording</p>
          <audio controls src={audioURL} className="w-full" />
          <p className="text-xs leading-relaxed text-text-muted" role="status">
            Play the recording back. Notice one unclear, repetitive, abrupt, or
            underexplained place to strengthen later.
          </p>
          {audioURL.startsWith("http") ? (
            <a
              id="download-latest-audio-ui"
              href={audioURL}
              download="read-aloud"
              className="inline-flex min-h-[44px] items-center text-sm text-theme-blue underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2"
            >
              Download recording
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (prominent) {
    return (
      <div className="rounded-xl border-2 border-theme-blue/25 bg-theme-blue/5 px-5 py-4 shadow-soft">
        {controls}
      </div>
    );
  }

  return (
    <details className="rounded-lg border border-border-soft/60 bg-surface-soft/30 px-4 py-3">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 text-sm font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true">▾</span>
        Hear your draft aloud
      </summary>
      <div className="mt-3">{controls}</div>
    </details>
  );
}
