import { TargetResultsDashboard } from "../components/TargetResultsDashboard";
import { usePouchDB } from "../pouchdb";

// Example usage page component
export default function TargetResultsPage() {
  const { db } = usePouchDB();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <TargetResultsDashboard db={db} />
      </div>
    </div>
  );
}