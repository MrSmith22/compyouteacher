import { nowIso } from "@/lib/parsing/time";

export function normalizeProofPlan(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);
}

export function mergeOptionalRef<T extends string | null>(
  inputValue: T | undefined,
  existingValue: T | undefined
): T {
  return (inputValue !== undefined ? inputValue ?? null : existingValue ?? null) as T;
}

export function mergeTimestamps(existingCreatedAt?: string | null) {
  const timestamp = nowIso();
  return {
    createdAt: existingCreatedAt ?? timestamp,
    updatedAt: timestamp,
  };
}
