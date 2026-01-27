import { useCallback, useState } from 'react'
import { usePouchDB } from '../contexts/PouchDBContext'
import type { UUID, EpochTime } from '../../lib/tracker/types'

export interface Event {
  id: UUID
  metricId: UUID
  timestamp: EpochTime
  value: number
  metadata?: Record<string, unknown>
  createdAt: EpochTime
}

export interface EventCreateInput {
  metricId: UUID
  timestamp: EpochTime
  value: number
  metadata?: Record<string, unknown>
}

export interface EventUpdateInput {
  timestamp?: EpochTime
  value?: number
  metadata?: Record<string, unknown>
}

export interface EventQuery {
  metricId?: UUID
  from?: EpochTime
  to?: EpochTime
  limit?: number
  skip?: number
}

export function useEvent() {
  const db = usePouchDB()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createEvent = useCallback(async (input: EventCreateInput): Promise<Event> => {
    setLoading(true)
    setError(null)
    
    try {
      const event: Event = {
        id: `event_${crypto.randomUUID()}`,
        ...input,
        createdAt: Date.now()
      }
      
      await db.put({
        _id: event.id,
        ...event
      })
      
      return event
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const updateEvent = useCallback(async (id: UUID, input: EventUpdateInput): Promise<Event> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      const updatedEvent: Event = {
        ...doc,
        ...input
      }
      
      await db.put({
        ...updatedEvent,
        _id: id,
        _rev: doc._rev
      })
      
      return updatedEvent
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const deleteEvent = useCallback(async (id: UUID): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      await db.remove(doc)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const getEvent = useCallback(async (id: UUID): Promise<Event> => {
    setLoading(true)
    setError(null)
    
    try {
      const doc = await db.get(id)
      return doc as Event
    } catch (err) {
      if ((err as any).status === 404) {
        throw new Error('Event not found')
      }
      setError(err instanceof Error ? err.message : 'Failed to get event')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const getEvents = useCallback(async (query: EventQuery = {}): Promise<Event[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await db.allDocs({
        include_docs: true,
        startkey: 'event_',
        endkey: 'event_\uffff'
      })
      
      let events = result.rows
        .filter((row: any) => row.id.startsWith('event_'))
        .map((row: any) => row.doc as Event)
      
      // Apply filters
      if (query.metricId) {
        events = events.filter((e: Event) => e.metricId === query.metricId)
      }
      if (query.from !== undefined) {
        events = events.filter((e: Event) => e.timestamp >= query.from!)
      }
      if (query.to !== undefined) {
        events = events.filter((e: Event) => e.timestamp <= query.to!)
      }
      
      // Sort by timestamp (newest first)
      events.sort((a: Event, b: Event) => b.timestamp - a.timestamp)
      
      // Apply pagination
      if (query.skip) {
        events = events.slice(query.skip)
      }
      if (query.limit) {
        events = events.slice(0, query.limit)
      }
      
      return events
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get events')
      throw err
    } finally {
      setLoading(false)
    }
  }, [db])

  const refreshEvents = useCallback(async (): Promise<Event[]> => {
    return getEvents()
  }, [getEvents])

  return {
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    getEvent,
    getEvents,
    refreshEvents
  }
}
