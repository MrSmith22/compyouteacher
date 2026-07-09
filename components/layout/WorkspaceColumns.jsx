const LG_COLUMN_LAYOUTS = {
  default: "lg:grid-cols-[minmax(0,1.72fr)_minmax(280px,0.95fr)]",
  drafting: "lg:grid-cols-[260px_minmax(700px,1fr)_320px]",
};

const XL_COLUMN_LAYOUTS = {
  default:
    "xl:grid-cols-[minmax(240px,0.24fr)_minmax(0,0.52fr)_minmax(240px,0.24fr)]",
  drafting: "xl:grid-cols-[260px_minmax(700px,1fr)_320px]",
};

export default function WorkspaceColumns({
  children,
  className = "",
  variant = "default",
}) {
  const lgColumns = LG_COLUMN_LAYOUTS[variant] ?? LG_COLUMN_LAYOUTS.default;
  const xlColumns =
    XL_COLUMN_LAYOUTS[variant] ?? XL_COLUMN_LAYOUTS.default;

  return (
    <div
      className={[
        "grid grid-cols-1 gap-5",
        lgColumns,
        xlColumns,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
