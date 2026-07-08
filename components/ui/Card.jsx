const PADDING_CLASSES = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const ELEVATION_CLASSES = {
  none: "",
  soft: "shadow-soft",
  card: "shadow-card",
};

const SURFACE_CLASSES = {
  default: "bg-surface border border-border-soft",
  soft: "bg-surface-soft border border-border-soft",
};

export default function Card({
  as: Component = "div",
  children,
  className = "",
  padding = "md",
  elevation = "card",
  surface = "default",
  ...props
}) {
  return (
    <Component
      className={[
        "rounded-xl transition-shadow duration-150",
        SURFACE_CLASSES[surface] || SURFACE_CLASSES.default,
        ELEVATION_CLASSES[elevation] || ELEVATION_CLASSES.card,
        PADDING_CLASSES[padding] || PADDING_CLASSES.md,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}
