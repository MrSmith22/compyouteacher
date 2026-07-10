export const LAYOUT_MODES = {
  READING: "reading",
  WORKSPACE: "workspace",
};

/**
 * Interactive student modules share WorkspaceLayout (wide shell + responsive padding).
 * ReadingLayout (max-w-3xl) remains for Module 1, dashboards, and success-style reading pages
 * that are not under these prefixes.
 *
 * Module 9 is workspace so its single-column content can use ModulePageShell widths
 * instead of being capped by ReadingLayout’s max-w-3xl (WP-005).
 */
const WORKSPACE_ROUTE_PREFIXES = [
  "/modules/2",
  "/modules/3",
  "/modules/4",
  "/modules/5",
  "/modules/6",
  "/modules/7",
  "/modules/8",
  "/modules/9",
];

function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function resolveLayoutMode(pathname = "/") {
  if (WORKSPACE_ROUTE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return LAYOUT_MODES.WORKSPACE;
  }

  return LAYOUT_MODES.READING;
}
