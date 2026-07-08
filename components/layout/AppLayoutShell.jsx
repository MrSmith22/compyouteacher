"use client";

import ReadingLayout from "@/components/layout/ReadingLayout";
import WorkspaceLayout from "@/components/layout/WorkspaceLayout";
import { LAYOUT_MODES, resolveLayoutMode } from "@/components/layout/layoutModes";
import { usePathname } from "next/navigation";

export default function AppLayoutShell({ children }) {
  const pathname = usePathname() || "/";
  const layoutMode = resolveLayoutMode(pathname);
  const Layout =
    layoutMode === LAYOUT_MODES.WORKSPACE ? WorkspaceLayout : ReadingLayout;

  return <Layout>{children}</Layout>;
}
