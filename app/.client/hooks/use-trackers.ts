import { useCallback, useEffect } from 'react'
import { usePouchDB } from '../contexts/PouchDB'
import { useTrackerStore } from '../stores/trackerStore'
import type { UUID } from '../../lib/tracker/types'
import type {
  Tracker,
  TrackerQuery
} from '../stores/trackerStore'

export function useTrackers() {
  const { db } = usePouchDB()
  const {
    trackers,
    loading,
    error,
    setLoading,
    setError,
    setTrackers,
    clearError,
    removeTracker
  } = useTrackerStore()


  useEffect(() => {
    loadTrackers();
  }, []);

  const loadTrackers = async () => {
    try {
      await getTrackers();
    } catch (err) {
      console.error('Failed to load trackers:', err);
    }
  };


  const getTrackers = useCallback(async (query: TrackerQuery = {}): Promise<Tracker[]> => {
    setLoading(true)
    clearError()
    
    try {
      const result = await db.allDocs({
        include_docs: true,
        startkey: 'tracker:',
        endkey: 'tracker:\uffff'
      })
      
      let trackers = result.rows
        .filter(row => row.id.startsWith('tracker:'))
        .map(row => row.doc as unknown as Tracker)
      
      // Apply pagination
      if (query.skip) {
        trackers = trackers.slice(query.skip)
      }
      if (query.limit) {
        trackers = trackers.slice(0, query.limit)
      }
      
      setTrackers(trackers)
      return trackers
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get trackers'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [db, setLoading, clearError, setTrackers, setError])

  const refreshTrackers = useCallback(async (): Promise<Tracker[]> => {
    return getTrackers()
  }, [getTrackers])
  
  const deleteTracker = useCallback(async (id: UUID): Promise<void> => {
    setLoading(true)
    clearError()
    
    try {
      const doc = await db.get(id)
      await db.remove(doc)
      removeTracker(id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tracker'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [db, setLoading, clearError, removeTracker, setError])

  return {
    trackers,
    loading,
    error,
    getTrackers,
    refreshTrackers,
    deleteTracker
  }
}
