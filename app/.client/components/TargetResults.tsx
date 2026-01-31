import { TargetResultsDashboard } from './TargetResultsDashboard';
import { usePouchDB } from '../pouchdb';

// Simple demo component to showcase the TargetResultsDashboard
export function TargetResults() {
  const { db } = usePouchDB();

  return (
    <div className="p-6 h-screen overflow-y-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Target Results Dashboard</h1>
      
      {/* Show all targets */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">All Targets</h2>
        <TargetResultsDashboard db={db} />
      </div>

      {/* Example: Show targets for a specific tracker */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Last 30 Days Performance</h2>
        <TargetResultsDashboard 
          db={db}
          from={Date.now() - (30 * 24 * 60 * 60 * 1000)} // Last 30 days
          to={Date.now()}
        />
      </div>

      {/* Example: Show specific targets */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Selected Targets</h2>
        <TargetResultsDashboard 
          db={db}
          targetIds={['target:example1', 'target:example2']} // Replace with actual target IDs
        />
      </div>
    </div>
  );
}
