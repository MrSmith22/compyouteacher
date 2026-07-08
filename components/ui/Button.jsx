const VARIANT_CLASSES = {
  primary:
    "bg-theme-blue text-white shadow-soft hover:opacity-90 focus:ring-theme-blue/20",
  secondary:
    "bg-surface border border-border-soft text-text-primary shadow-soft hover:bg-surface-soft focus:ring-theme-blue/15",
  tertiary:
    "bg-surface-soft text-text-primary hover:bg-theme-light focus:ring-theme-blue/15",
  text: "bg-transparent text-theme-blue hover:bg-theme-blue/5 focus:ring-theme-blue/15",
  icon: "bg-surface border border-border-soft text-text-primary shadow-soft hover:bg-surface-soft focus:ring-theme-blue/15",
};

const TONE_CLASSES = {
  default: "",
  success:
    "bg-theme-green text-white hover:opacity-90 focus:ring-theme-green/20 border-transparent",
  warning:
    "bg-theme-orange text-white hover:opacity-90 focus:ring-theme-orange/20 border-transparent",
  destructive:
    "bg-theme-red text-white hover:opacity-90 focus:ring-theme-red/20 border-transparent",
};

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
  icon: "h-9 w-9 p-0 text-sm",
};

export default function Button({
  as: Component = "button",
  variant = "primary",
  tone = "default",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const appliedSize = variant === "icon" ? "icon" : size;
  const toneClass = tone !== "default" ? TONE_CLASSES[tone] : "";
  const variantClass =
    tone !== "default" && variant === "primary"
      ? TONE_CLASSES[tone]
      : VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const componentProps =
    Component === "button" ? { type: "button", ...props } : props;

  return (
    <Component
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        SIZE_CLASSES[appliedSize] || SIZE_CLASSES.md,
        toneClass || variantClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...componentProps}
    >
      {children}
    </Component>
  );
}
