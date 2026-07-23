export default function WorkspaceGuide({ children, className = "", ...rest }) {
  return (
    <div
      {...rest}
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
