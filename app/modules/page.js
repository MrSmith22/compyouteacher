import ModuleSystem from "../../components/ModuleSystem";

export default function ModulesPage() {
  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6 sm:p-10">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center text-theme-red">MLK Essay Modules</h1>
        <p className="text-center text-lg text-gray-700">
          Work through the modules step by step to develop your rhetorical analysis.
        </p>
        <ModuleSystem />
      </div>
    </div>
  );
}