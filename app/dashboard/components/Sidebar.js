export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-800 text-white p-6">
      <h2 className="text-xl font-bold mb-4">Comp-YouTeacher</h2>
      <ul>
        <li className="mb-2">
          <a href="/dashboard" className="text-gray-300 hover:text-white">
            Dashboard
          </a>
        </li>
        <li className="mb-2">
          <a href="/assignments" className="text-gray-300 hover:text-white">
            Assignments
          </a>
        </li>
        <li className="mb-2">
          <a href="/settings" className="text-gray-300 hover:text-white">
            Settings
          </a>
        </li>
      </ul>
    </div>
  );
}
