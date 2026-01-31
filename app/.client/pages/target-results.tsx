import { TargetResultsDashboard } from '../components/TargetResultsDashboard';
import { usePouchDB } from '../pouchdb';

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

// Example of using with specific filters
export function TrackerTargetResults({ trackerId }: { trackerId: string }) {
  const { db } = usePouchDB();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tracker Performance</h1>
      <TargetResultsDashboard 
        db={db} 
        trackerId={trackerId}
        from={Date.now() - (30 * 24 * 60 * 60 * 1000)} // Last 30 days
        to={Date.now()}
      />
    </div>
  );
}

// Example of using with specific targets
export function SelectedTargetsResults({ targetIds }: { targetIds: string[] }) {
  const { db } = usePouchDB();

  return (
    <TargetResultsDashboard 
      db={db} 
      targetIds={targetIds}
    />
  );
}
