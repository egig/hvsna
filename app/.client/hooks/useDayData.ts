import { useEffect, useState, useCallback } from "react";
import { useNote } from "./useNote";
import type { Note, NoteCreateInput, NoteUpdateInput } from "../../lib/types/note";

export function useDayData(date: string) {
    const [dayData, setDayData] = useState<Note | null>(null);
    const { getNote, createNote, updateNote, loading, error } = useNote();

    useEffect(() => {
        const fetchDayData = async () => {
            try {
                const data = await getNote(date);
                setDayData(data);
            } catch (err) {
                // Note not found is expected for new days
                console.log('No existing data for date:', date);
            }
        };

        fetchDayData();
    }, [getNote, date]);
    
    const getDayData = useCallback(async (): Promise<Note | null> => {
        try {
            const data = await getNote(date);
            setDayData(data);
            return data;
        } catch (err) {
            return null;
        }
    }, [getNote, date]);

    const saveDayData = useCallback(async (data: Omit<NoteCreateInput, 'id'>): Promise<void> => {
        try {
            let savedNote = await getNote(date);
            
            if (savedNote) {
                // Update existing note
                const updateInput: NoteUpdateInput = {
                    content: data.content,
                };
                await updateNote(date, updateInput);
            } else {
                // Create new note
                const createInput: NoteCreateInput = {
                    id: date,
                    ...data,
                };
                savedNote = await createNote(createInput);
            }
            
        } catch (err) {
            throw new Error(`Failed to save day data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }, [dayData, createNote, updateNote, date]);

    return {
        dayData,
        loading,
        error,
        getDayData,
        saveDayData,
    };
}