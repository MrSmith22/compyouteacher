export default function WorkspaceSidebar({ children, className = "" }) {
  return (
    <div
      className={[
        "order-3 space-y-4",
        "lg:col-span-2",
        "xl:order-1 xl:col-span-1 xl:sticky xl:top-6 xl:self-start",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
