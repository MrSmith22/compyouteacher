export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() ? value : null;
}

export function asTrimmedString(value: unknown): string {
  return asString(value).trim();
}

export function asNullableTrimmedString(value: unknown): string | null {
  const trimmed = asTrimmedString(value);
  return trimmed || null;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : asString(item).trim()))
    .filter(Boolean);
}
