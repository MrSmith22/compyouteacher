/**
 * Dev-only tooling gate. Never enable in production builds.
 */
export function isDevToolingEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}
