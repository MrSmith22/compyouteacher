export function requireNoError<T>(
  result: { data: T; error: { message?: string } | null },
  label: string
): T {
  if (result.error) {
    throw new Error(result.error.message || `Failed to read ${label}`);
  }

  return result.data;
}
