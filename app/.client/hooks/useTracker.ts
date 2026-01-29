import { useCallback } from 'react'
import { usePouchDB } from '../contexts/PouchDB'
import { useTrackerStore } from '../stores/trackerStore'
import type { UUID } from '../../lib/tracker/types'
import type {
  Tracker,
  TrackerCreateInput,
  TrackerUpdateInput,
  TrackerQuery
} from '../stores/trackerStore'

export function useTracker() {
  const { db } = usePouchDB()
  const {
    trackers,
    loading,
    error,
    setLoading,
    setError,
    setTrackers,
    addTracker,
    updateTracker: updateTrackerInStore,
    removeTracker,
    clearError
  } = useTrackerStore()

  const createTracker = useCallback(async (input: TrackerCreateInput): Promise<Tracker> => {
    setLoading(true)
    clearError()
    
    try {
      const tracker: Tracker = {
        id: `tracker:${crypto.randomUUID()}`,
        ...input,
        createdAt: Date.now()
      }
      
      await db.put({
        _id: tracker.id,
        ...tracker
      })
      
      addTracker(tracker)
      return tracker
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tracker'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [db, setLoading, clearError, addTracker, setError])

  const updateTracker = useCallback(async (id: UUID, input: TrackerUpdateInput): Promise<Tracker> => {
    setLoading(true)
    clearError()
    
    try {
      const doc = await db.get(id)
      const updatedTracker: Tracker = {
        ...(doc as unknown as Tracker),
        ...input
      }
      
      await db.put({
        ...updatedTracker,
        _id: id,
        _rev: doc._rev
      })
      
      updateTrackerInStore(id, updatedTracker)
      return updatedTracker
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tracker'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [db, setLoading, clearError, updateTrackerInStore, setError])

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

  const getTracker = useCallback(async (id: UUID): Promise<Tracker> => {
    setLoading(true)
    clearError()
    
    try {
      const doc = await db.get(id)
      return doc as unknown as Tracker
    } catch (err) {
      if ((err as any).status === 404) {
        throw new Error('Tracker not found')
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to get tracker'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [db, setLoading, clearError, setError])

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

  return {
    trackers,
    loading,
    error,
    createTracker,
    updateTracker,
    deleteTracker,
    getTracker,
    getTrackers,
    refreshTrackers
  }
}
