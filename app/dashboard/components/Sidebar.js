export default function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-theme-dark text-white p-6 shadow-md">
      <h2 className="text-2xl font-extrabold mb-8 tracking-wide text-theme-green">
        The Writing Processor
      </h2>
      <nav className="space-y-4">
        <a
          href="/dashboard"
          className="block text-sm text-gray-300 hover:text-white transition-colors"
        >
          📊 Dashboard
        </a>
        <a
          href="/assignments"
          className="block text-sm text-gray-300 hover:text-white transition-colors"
        >
          ✏️ Assignments
        </a>
        <a
          href="/settings"
          className="block text-sm text-gray-300 hover:text-white transition-colors"
        >
          ⚙️ Settings
        </a>
      </nav>
    </div>
  );
}