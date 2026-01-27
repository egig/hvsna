import { useCallback, useState } from 'react'
import { usePouchDB } from '../contexts/PouchDBContext'
import type { UUID, EpochTime } from '../../lib/tracker/types'

export interface Metric {
  id: UUID
  name: string
  unit: string
  reducer: MetricReducer
  direction: MetricDirection
  baseline: number
  createdAt: EpochTime
}

export type MetricReducer = 'sum' | 'count' | 'last' | 'avg' | 'min' | 'max'
export type MetricDirection = 'increase' | 'decrease' | 'neutral'

export interface MetricCreateInput {
  name: string
  unit: string
  reducer: MetricReducer
  direction: MetricDirection
  baseline: number
}

export interface MetricUpdateInput {
  name?: string
  unit?: string
  reducer?: MetricReducer
  direction?: MetricDirection
  baseline?: number
}

export interface MetricQuery {
  reducer?: MetricReducer
  direction?: MetricDirection
  limit?: number
  skip?: number
}

export function useMetric() {
  const db = usePouchDB()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createMetric = useCallback(async (input: MetricCreateInput): Promise<Metric> => {
    setLoading(true)
    setError(null)
    
    try {
      const metric: Metric = {
        id: `metric_${crypto.randomUUID()}`,
        ...input,
        createdAt: Date.now()
      }
      
      await db.put({
        _id: metric.id,
        ...metric
      })
      
      return metric
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create metric')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const updateMetric = useCallback(async (id: UUID, input: MetricUpdateInput): Promise<Metric> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      const updatedMetric: Metric = {
        ...doc,
        ...input
      }
      
      await db.put({
        ...updatedMetric,
        _id: id,
        _rev: doc._rev
      })
      
      return updatedMetric
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update metric')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const deleteMetric = useCallback(async (id: UUID): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      await db.remove(doc)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete metric')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const getMetric = useCallback(async (id: UUID): Promise<Metric> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      return doc as Metric
    } catch (err) {
      if ((err as any).status === 404) {
        throw new Error('Metric not found')
      }
      setError(err instanceof Error ? err.message : 'Failed to get metric')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const getMetrics = useCallback(async (query: MetricQuery = {}): Promise<Metric[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await db.allDocs({
        include_docs: true,
        startkey: 'metric_',
        endkey: 'metric_\uffff'
      })
      
      let metrics = result.rows
        .filter(row => row.id.startsWith('metric_'))
        .map(row => row.doc as Metric)
      
      // Apply filters
      if (query.reducer) {
        metrics = metrics.filter(m => m.reducer === query.reducer)
      }
      if (query.direction) {
        metrics = metrics.filter(m => m.direction === query.direction)
      }
      
      // Apply pagination
      if (query.skip) {
        metrics = metrics.slice(query.skip)
      }
      if (query.limit) {
        metrics = metrics.slice(0, query.limit)
      }
      
      return metrics
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get metrics')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const refreshMetrics = useCallback(async (): Promise<Metric[]> => {
    return getMetrics()
  }, [getMetrics])

  return {
    loading,
    error,
    createMetric,
    updateMetric,
    deleteMetric,
    getMetric,
    getMetrics,
    refreshMetrics
  }
}
