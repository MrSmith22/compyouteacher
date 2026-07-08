export async function parseApiResponse(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }

  return json;
}
