/**
 * Wide interactive shell for Modules 2–9.
 * Responsive padding scales from phone → tablet → Chromebook → desktop.
 * Inner modules use ModulePageShell / step frames for content width.
 */
export default function WorkspaceLayout({ children }) {
  return (
    <div className="min-h-screen px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 xl:px-8">
      <div className="mx-auto w-full max-w-[1800px]">{children}</div>
    </div>
  );
}
