import { useCallback, useEffect, useState } from "react";
import { usePouchDB } from "../contexts/PouchDB";
import type { Target, TargetQuery } from "./use-target";

export function useTargets() {
  const { db } = usePouchDB();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
    getTargets();
  }, []);

  const getTargets = useCallback(
    async (query: TargetQuery = {}): Promise<Target[]> => {
      setLoading(true);
      setError(null);

      try {
        const result = await db.allDocs({
          include_docs: true,
          startkey: "target:",
          endkey: "target:\uffff",
        });

        let targets = result.rows
          .filter((row) => row.id.startsWith("target:"))
          .map((row) => row.doc as unknown as Target);

        // Apply filters
        if (query.trackerId) {
          targets = targets.filter((t) => t.trackerId === query.trackerId);
        }
        if (query.type) {
          targets = targets.filter((t) => t.type === query.type);
        }
        if (query.reducer) {
          targets = targets.filter((t) => t.reducer === query.reducer);
        }
        if (query.direction) {
          targets = targets.filter((t) => t.direction === query.direction);
        }
        if (query.period) {
          targets = targets.filter((t) => t.period === query.period);
        }
        if (query.soft !== undefined) {
          targets = targets.filter((t) => t.soft === query.soft);
        }

        // Apply pagination
        if (query.skip) {
          targets = targets.slice(query.skip);
        }
        if (query.limit) {
          targets = targets.slice(0, query.limit);
        }

        setTargets(targets);
        return targets;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get targets");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const refreshTargets = useCallback(async (): Promise<Target[]> => {
    return getTargets();
  }, [getTargets]);

  return {
    loading,
    error,
    targets,
    getTargets,
    refreshTargets,
  };
}
