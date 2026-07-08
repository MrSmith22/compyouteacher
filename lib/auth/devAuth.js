/**
 * Development-only auth helpers. Never enable in production.
 */
export function isDevAuthEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_AUTH_ENABLED === "true"
  );
}

export function isDevAuthPublicEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_DEV_AUTH_ENABLED === "true"
  );
}
