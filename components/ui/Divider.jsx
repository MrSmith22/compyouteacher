export default function Divider({ className = "" }) {
  return (
    <div
      className={["h-px w-full bg-border-soft", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    />
  );
}
