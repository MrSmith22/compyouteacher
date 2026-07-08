export default function WorkspaceColumns({ children, className = "" }) {
  return (
    <div
      className={[
        "grid grid-cols-1 gap-5",
        "lg:grid-cols-[minmax(0,1.72fr)_minmax(280px,0.95fr)]",
        "xl:grid-cols-[minmax(240px,0.24fr)_minmax(0,0.52fr)_minmax(240px,0.24fr)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
