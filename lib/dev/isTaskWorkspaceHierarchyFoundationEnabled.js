/**
 * WP-096 — Development-only presentation gate for the task-workspace hierarchy.
 * Does not alter instructional rollout selection, saves, artifacts, or progression.
 */

export function isTaskWorkspaceHierarchyFoundationEnabled() {
  if (process.env.NODE_ENV !== "development") return false;
  return process.env.NEXT_PUBLIC_TASK_WORKSPACE_HIERARCHY !== "off";
}
