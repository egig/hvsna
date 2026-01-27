import { useCallback, useState } from 'react'
import { usePouchDB } from '../contexts/PouchDB'
import type { UUID, EpochTime } from '../../lib/tracker/types'

export interface Tracker {
  id: UUID
  name: string
  unit: string
  baseline: number
  createdAt: EpochTime
}

export interface TrackerCreateInput {
  name: string
  unit: string
  baseline: number
}

export interface TrackerUpdateInput {
  name?: string
  unit?: string
  baseline?: number
}

export interface TrackerQuery {
  limit?: number
  skip?: number
}

export function useTracker() {
  const { db } = usePouchDB()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTracker = useCallback(async (input: TrackerCreateInput): Promise<Tracker> => {
    setLoading(true)
    setError(null)
    
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
      
      return tracker
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tracker')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const updateTracker = useCallback(async (id: UUID, input: TrackerUpdateInput): Promise<Tracker> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      const updatedTracker: Tracker = {
        ...doc as Tracker,
        ...input
      }
      
      await db.put({
        ...updatedTracker,
        _id: id,
        _rev: doc._rev
      })
      
      return updatedTracker
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tracker')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const deleteTracker = useCallback(async (id: UUID): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      await db.remove(doc)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tracker')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const getTracker = useCallback(async (id: UUID): Promise<Tracker> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      return doc as unknown as Tracker
    } catch (err) {
      if ((err as any).status === 404) {
        throw new Error('Tracker not found')
      }
      setError(err instanceof Error ? err.message : 'Failed to get tracker')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const getTrackers = useCallback(async (query: TrackerQuery = {}): Promise<Tracker[]> => {
    setLoading(true)
    setError(null)
    
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
      
      return trackers
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get trackers')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const refreshTrackers = useCallback(async (): Promise<Tracker[]> => {
    return getTrackers()
  }, [getTrackers])

  return {
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
