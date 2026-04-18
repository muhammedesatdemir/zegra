/**
 * Startup Timer
 *
 * Lightweight timing instrumentation for the app boot sequence.
 *
 * Why this exists:
 *   Production APKs showed 2–9s of white/blank screen after the splash
 *   hid. To know *where* the time is actually spent (module eval, store
 *   hydration, first screen mount, first paint) we need millisecond-level
 *   marks across modules — not a profiler.
 *
 * Design:
 *   - t0 is captured the moment this module is first evaluated. For a
 *     freshly-launched RN app this is very close to JS bundle start,
 *     which is the earliest point we can observe from JS.
 *   - `mark(label)` records an elapsed-ms-since-t0 entry and logs a
 *     single tagged line so it's greppable in `adb logcat` / Metro.
 *   - Duplicate labels are ignored so re-renders don't spam the log.
 *   - Output is a one-liner per mark; no JSON, no stack traces.
 *
 * Safe in production: just console.log + a small in-memory array.
 */

type Mark = { label: string; elapsedMs: number };

const t0 = Date.now();
const marks: Mark[] = [];
const seen = new Set<string>();

function now(): number {
  return Date.now();
}

export function mark(label: string): void {
  if (seen.has(label)) return;
  seen.add(label);

  const elapsedMs = now() - t0;
  marks.push({ label, elapsedMs });

  // Single-line, tagged, greppable. Padded so columns align in logcat.
  const pad = String(elapsedMs).padStart(5, ' ');
  // eslint-disable-next-line no-console
  console.log(`[startup] +${pad}ms  ${label}`);
}

export function getMarks(): ReadonlyArray<Mark> {
  return marks;
}

export function getStartTime(): number {
  return t0;
}

// Record the very first mark on module load so we know when the JS
// side of the app actually came alive relative to everything else.
mark('app start (js bundle eval begin)');
