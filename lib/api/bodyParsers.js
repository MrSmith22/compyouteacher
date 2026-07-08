export async function parseJsonBody(req) {
  return req.json().catch(() => ({}));
}

export function parseOptionalStringField(body, field) {
  return typeof body?.[field] === "string" ? body[field] : undefined;
}

export function parseOptionalNullableRefId(body, field) {
  if (body?.[field] === null) {
    return null;
  }

  return typeof body?.[field] === "string" ? body[field].trim() || null : undefined;
}

export function parseRequiredTrimmedString(body, field) {
  return typeof body?.[field] === "string" ? body[field].trim() : "";
}
