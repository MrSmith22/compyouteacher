export default function WorkspaceCenter({ children, className = "", ...rest }) {
  return (
    <div
      {...rest}
      className={["order-1 min-w-0", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
