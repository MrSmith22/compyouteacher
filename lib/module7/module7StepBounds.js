/**
 * Module 7 step index model (pure).
 * 0 = Read Aloud
 * 1...N = section revision screens
 * N+1 = Final Review
 * total visible steps = N + 2
 */

export function getModule7MaxStepIndex(sectionStepCount) {
  const n = Number(sectionStepCount) || 0;
  if (n <= 0) return 0;
  return n + 1;
}

export function getModule7TotalSteps(sectionStepCount) {
  const n = Number(sectionStepCount) || 0;
  if (n <= 0) return 0;
  return n + 2;
}

export function clampModule7StepIndex(index, sectionStepCount) {
  const n = Number(sectionStepCount) || 0;
  if (n <= 0) return 0;
  const maxIndex = getModule7MaxStepIndex(n);
  const raw = Number(index);
  if (!Number.isFinite(raw) || raw < 0) return 0;
  if (raw > maxIndex) return maxIndex;
  return raw;
}

export function getModule7StepKind(index, sectionStepCount) {
  const n = Number(sectionStepCount) || 0;
  const i = Number(index);
  if (n <= 0 || !Number.isFinite(i)) return "invalid";
  if (i === 0) return "read-aloud";
  if (i === n + 1) return "final-review";
  if (i >= 1 && i <= n) return "section";
  return "invalid";
}

export function isModule7ConclusionIndex(index, sectionStepCount) {
  const n = Number(sectionStepCount) || 0;
  return n > 0 && Number(index) === n;
}

export function advanceModule7StepIndex(index, sectionStepCount) {
  return clampModule7StepIndex(Number(index) + 1, sectionStepCount);
}

export function retreatModule7StepIndex(index, sectionStepCount) {
  return clampModule7StepIndex(Number(index) - 1, sectionStepCount);
}
