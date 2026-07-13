/**
 * Bounded waits for Google Docs/Drive operations.
 * Prevents export/verify requests from hanging indefinitely.
 */

export const GOOGLE_OPERATION_TIMEOUT_MS = 25_000;
export const GOOGLE_EXPORT_OVERALL_TIMEOUT_MS = 55_000;

export class GoogleOperationTimeoutError extends Error {
  constructor(step, timeoutMs = GOOGLE_OPERATION_TIMEOUT_MS) {
    super(
      `Google ${step} timed out after ${timeoutMs}ms. Check your connection and try again.`
    );
    this.name = "GoogleOperationTimeoutError";
    this.code = "google_operation_timeout";
    this.step = step;
    this.timeoutMs = timeoutMs;
  }
}

export function isGoogleOperationTimeoutError(err) {
  return (
    err instanceof GoogleOperationTimeoutError ||
    err?.code === "google_operation_timeout" ||
    (typeof err?.message === "string" &&
      /timed out after \d+ms/i.test(err.message))
  );
}

/**
 * Race a promise against a timeout. Does not cancel the underlying work,
 * but unbound Google awaits will no longer block the HTTP response forever.
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {{ step: string, timeoutMs?: number }} options
 * @returns {Promise<T>}
 */
export async function withGoogleTimeout(
  promise,
  { step, timeoutMs = GOOGLE_OPERATION_TIMEOUT_MS } = {}
) {
  if (!step) {
    throw new Error("withGoogleTimeout requires a step name");
  }

  let timer = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new GoogleOperationTimeoutError(step, timeoutMs));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Wrap an async function so every invocation is timed out.
 * @param {string} step
 * @param {Function} fn
 * @param {number} [timeoutMs]
 */
export function wrapWithGoogleTimeout(step, fn, timeoutMs = GOOGLE_OPERATION_TIMEOUT_MS) {
  return async (...args) =>
    withGoogleTimeout(Promise.resolve().then(() => fn(...args)), {
      step,
      timeoutMs,
    });
}
