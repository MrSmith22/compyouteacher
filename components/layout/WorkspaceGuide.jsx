export default function WorkspaceGuide({ children, className = "" }) {
  return (
    <div
      className={[
        "order-2 space-y-4 lg:self-start xl:order-3 xl:sticky xl:top-6 xl:self-start",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
