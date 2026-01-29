import { useCallback, useState } from 'react'
import { usePouchDB } from '../contexts/PouchDB'
import type { UUID, EpochTime } from '../../lib/tracker/types'

export interface Target {
  id: UUID
  trackerId: UUID
  type: TargetType
  reducer: TargetReducer
  direction: TargetDirection
  value: number
  valueMax?: number
  period?: TargetPeriod
  soft: boolean
  createdAt: EpochTime
}

export type TargetType = 'static' | 'range'
export type TargetReducer = 'sum' | 'count' | 'last' | 'avg' | 'min' | 'max'
export type TargetDirection = 'increase' | 'decrease' | 'neutral'
export type TargetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'total'

export interface TargetCreateInput {
  trackerId: UUID
  type: TargetType
  reducer: TargetReducer
  direction: TargetDirection
  value: number
  valueMax?: number
  period?: TargetPeriod
  soft: boolean
}

export interface TargetUpdateInput {
  type?: TargetType
  reducer?: TargetReducer
  direction?: TargetDirection
  value?: number
  valueMax?: number
  period?: TargetPeriod
  soft?: boolean
}

export interface TargetQuery {
  trackerId?: UUID
  type?: TargetType
  reducer?: TargetReducer
  direction?: TargetDirection
  period?: TargetPeriod
  soft?: boolean
  limit?: number
  skip?: number
}

export function useTarget() {
  const { db } = usePouchDB()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTarget = useCallback(async (input: TargetCreateInput): Promise<Target> => {
    setLoading(true)
    setError(null)
    
    try {
      const target: Target = {
        id: `target:${crypto.randomUUID()}`,
        ...input,
        createdAt: Date.now()
      }

      await db.put({
        _id: target.id,
        ...target
      })
      
      return target
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create target')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const updateTarget = useCallback(async (id: UUID, input: TargetUpdateInput): Promise<Target> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      const updatedTarget: Target = {
        ...doc as unknown as Target,
        ...input
      }
      
      await db.put({
        ...updatedTarget,
        _id: id,
        _rev: doc._rev
      })
      
      return updatedTarget
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update target')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const deleteTarget = useCallback(async (id: UUID): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      await db.remove(doc)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete target')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const getTarget = useCallback(async (id: UUID): Promise<Target> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      return doc as unknown as Target
    } catch (err) {
      if ((err as any).status === 404) {
        throw new Error('Target not found')
      }
      setError(err instanceof Error ? err.message : 'Failed to get target')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  return {
    loading,
    error,
    createTarget,
    updateTarget,
    deleteTarget,
    getTarget
  }
}
