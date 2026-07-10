/**
 * Shared page shell for student modules inside WorkspaceLayout.
 *
 * - contentMax="none": full workspace width (Modules 6–8 drafting frames)
 * - contentMax="md"|"lg"|"xl": centered single column with readable line length
 *   (Module 9 and other single-column modules)
 *
 * Outer page padding and max-w-[1800px] come from WorkspaceLayout.
 * Do not add min-h-screen or page-level horizontal padding here.
 */

const CONTENT_MAX_CLASS = {
  none: "",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
};

export default function ModulePageShell({
  children,
  contentMax = "none",
  className = "",
}) {
  const maxClass = CONTENT_MAX_CLASS[contentMax] ?? CONTENT_MAX_CLASS.none;
  const rootClass = ["w-full pb-10", className].filter(Boolean).join(" ");

  if (!maxClass) {
    return <div className={rootClass}>{children}</div>;
  }

  return (
    <div className={rootClass}>
      <div className={["mx-auto w-full", maxClass].join(" ")}>{children}</div>
    </div>
  );
}
