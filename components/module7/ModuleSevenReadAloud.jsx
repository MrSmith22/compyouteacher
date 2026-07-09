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
}) {
  return (
    <details className="rounded-lg border border-border-soft/60 bg-surface-soft/30 px-4 py-3">
      <summary className="cursor-pointer list-none text-sm font-medium text-text-primary">
        Hear your draft aloud
      </summary>
      <div className="mt-3 space-y-3 text-left">
        <p className="text-xs leading-relaxed text-text-muted">
          Strong writers often read their work aloud. Hearing your sentences helps
          you notice awkward wording, missing explanation, repetitive phrasing,
          and confusing transitions.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="text-xs font-medium text-text-muted">Microphone</label>
          <select
            className="rounded-lg border border-border-soft bg-white px-2 py-1 text-sm text-text-primary"
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

        <div className="flex items-center gap-3">
          {!recording ? (
            <button
              type="button"
              onClick={onStart}
              disabled={locked}
              className="rounded-lg bg-theme-red px-4 py-2 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start read-aloud
            </button>
          ) : (
            <button
              type="button"
              onClick={onStop}
              className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-soft"
            >
              Stop recording
            </button>
          )}
        </div>

        {audioURL ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">Your recording</p>
            <audio controls src={audioURL} className="w-full" />
            <p className="text-xs leading-relaxed text-text-muted">
              As you listen, note places that sound choppy or unclear. Then revise
              those spots in the section on your desk.
            </p>
            {audioURL.startsWith("http") ? (
              <a
                id="download-latest-audio-ui"
                href={audioURL}
                download="read-aloud"
                className="text-sm text-theme-blue underline"
              >
                Download recording
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </details>
  );
}
