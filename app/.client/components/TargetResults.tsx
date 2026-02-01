import { TargetResultsDashboard } from "./TargetResultsDashboard";
import { usePouchDB } from "../pouchdb";

// Simple demo component to showcase the TargetResultsDashboard
export function TargetResults() {
  const { db } = usePouchDB();

  return (
    <div className="p-6 h-screen overflow-y-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Target Results Dashboard
      </h1>

      {/* Show all targets */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          All Targets
        </h2>
        <TargetResultsDashboard db={db} />
      </div>
    </div>
  );
}
