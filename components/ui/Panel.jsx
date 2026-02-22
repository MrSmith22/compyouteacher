export default function Panel({ children, className = "" }) {
    return (
      <div
        className={`bg-surface shadow-card border border-border-soft rounded-xl p-6 ${className}`}
      >
        {children}
      </div>
    );
  }