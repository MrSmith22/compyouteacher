export default function WorkspaceCenter({ children, className = "" }) {
  return (
    <div className={["order-1 min-w-0", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
