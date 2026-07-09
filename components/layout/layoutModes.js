export const LAYOUT_MODES = {
  READING: "reading",
  WORKSPACE: "workspace",
};

const WORKSPACE_ROUTE_PREFIXES = [
  "/modules/2",
  "/modules/3",
  "/modules/4",
  "/modules/5",
  "/modules/6",
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
