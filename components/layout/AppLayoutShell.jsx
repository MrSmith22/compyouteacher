"use client";

import ReadingLayout from "@/components/layout/ReadingLayout";
import WorkspaceLayout from "@/components/layout/WorkspaceLayout";
import { LAYOUT_MODES, resolveLayoutMode } from "@/components/layout/layoutModes";
import WritingSpineProvider from "@/components/assignments/WritingSpineProvider";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const DeveloperTestingPanel =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@/components/dev/DeveloperTestingPanel"), {
        ssr: false,
      })
    : null;

export default function AppLayoutShell({ children }) {
  const pathname = usePathname() || "/";
  const layoutMode = resolveLayoutMode(pathname);
  const Layout =
    layoutMode === LAYOUT_MODES.WORKSPACE ? WorkspaceLayout : ReadingLayout;

  return (
    <WritingSpineProvider>
      <Layout>
        {children}
        {DeveloperTestingPanel ? <DeveloperTestingPanel /> : null}
      </Layout>
    </WritingSpineProvider>
  );
}
