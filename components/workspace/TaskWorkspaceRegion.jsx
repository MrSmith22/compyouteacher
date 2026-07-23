"use client";

/**
 * WP-096 — Thin region wrapper mapping slots to hierarchy + color roles.
 * Presentation only — does not own persistence or navigation.
 */

import {
  describeTaskWorkspaceRegion,
  taskWorkspaceMobileOrderClass,
} from "@/lib/ui/taskWorkspaceContract";

export default function TaskWorkspaceRegion({
  regionId,
  evidenceSurface = false,
  className = "",
  mobileOrder = true,
  as: Component = "section",
  children,
  ...rest
}) {
  const region = describeTaskWorkspaceRegion(regionId, { evidenceSurface });
  const orderClass = mobileOrder ? taskWorkspaceMobileOrderClass(regionId) : "";

  return (
    <Component
      data-testid={region.testId}
      data-task-workspace-region={region.id}
      data-hierarchy-level={region.hierarchyLevel}
      data-instructional-color-role={region.colorRoleId || undefined}
      className={[orderClass, region.surfaceClass, className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </Component>
  );
}
