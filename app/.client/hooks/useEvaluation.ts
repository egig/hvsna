import { useCallback, useState } from 'react'
import { usePouchDB } from '../contexts/PouchDBContext'
import type { UUID, EpochTime } from '../../lib/tracker/types'

export interface Evaluation {
  id: UUID
  metricId: UUID
  type: EvaluationType
  value: number
  valueMax?: number
  period?: EvaluationPeriod
  soft: boolean
  createdAt: EpochTime
}

export type EvaluationType = 'target' | 'range' | 'threshold'
export type EvaluationPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'total'

export interface EvaluationCreateInput {
  metricId: UUID
  type: EvaluationType
  value: number
  valueMax?: number
  period?: EvaluationPeriod
  soft: boolean
}

export interface EvaluationUpdateInput {
  type?: EvaluationType
  value?: number
  valueMax?: number
  period?: EvaluationPeriod
  soft?: boolean
}

export interface EvaluationQuery {
  metricId?: UUID
  type?: EvaluationType
  period?: EvaluationPeriod
  soft?: boolean
  limit?: number
  skip?: number
}

export function useEvaluation() {
  const db = usePouchDB()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createEvaluation = useCallback(async (input: EvaluationCreateInput): Promise<Evaluation> => {
    setLoading(true)
    setError(null)
    
    try {
      const evaluation: Evaluation = {
        id: `evaluation_${crypto.randomUUID()}`,
        ...input,
        createdAt: Date.now()
      }
      
      await db.put({
        _id: evaluation.id,
        ...evaluation
      })
      
      return evaluation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create evaluation')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const updateEvaluation = useCallback(async (id: UUID, input: EvaluationUpdateInput): Promise<Evaluation> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      const updatedEvaluation: Evaluation = {
        ...doc,
        ...input
      }
      
      await db.put({
        ...updatedEvaluation,
        _id: id,
        _rev: doc._rev
      })
      
      return updatedEvaluation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update evaluation')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const deleteEvaluation = useCallback(async (id: UUID): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      await db.remove(doc)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete evaluation')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const getEvaluation = useCallback(async (id: UUID): Promise<Evaluation> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      return doc as Evaluation
    } catch (err) {
      if ((err as any).status === 404) {
        throw new Error('Evaluation not found')
      }
      setError(err instanceof Error ? err.message : 'Failed to get evaluation')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const getEvaluations = useCallback(async (query: EvaluationQuery = {}): Promise<Evaluation[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await db.allDocs({
        include_docs: true,
        startkey: 'evaluation_',
        endkey: 'evaluation_\uffff'
      })
      
      let evaluations = result.rows
        .filter((row: any) => row.id.startsWith('evaluation_'))
        .map((row: any) => row.doc as Evaluation)
      
      // Apply filters
      if (query.metricId) {
        evaluations = evaluations.filter((e: Evaluation) => e.metricId === query.metricId)
      }
      if (query.type) {
        evaluations = evaluations.filter((e: Evaluation) => e.type === query.type)
      }
      if (query.period) {
        evaluations = evaluations.filter((e: Evaluation) => e.period === query.period)
      }
      if (query.soft !== undefined) {
        evaluations = evaluations.filter((e: Evaluation) => e.soft === query.soft)
      }
      
      // Apply pagination
      if (query.skip) {
        evaluations = evaluations.slice(query.skip)
      }
      if (query.limit) {
        evaluations = evaluations.slice(0, query.limit)
      }
      
      return evaluations
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get evaluations')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const refreshEvaluations = useCallback(async (): Promise<Evaluation[]> => {
    return getEvaluations()
  }, [getEvaluations])

  return {
    loading,
    error,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    getEvaluation,
    getEvaluations,
    refreshEvaluations
  }
}
