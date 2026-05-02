import React, { createContext, useContext, useState, type ReactNode } from "react";

interface TrackerContextType {
  formOpen: boolean;
  editingTrackerId: string | null;
  openCreateForm: () => void;
  openEditForm: (id: string) => void;
  closeForm: () => void;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrackerId, setEditingTrackerId] = useState<string | null>(null);

  const openCreateForm = () => {
    setEditingTrackerId(null);
    setFormOpen(true);
  };

  const openEditForm = (id: string) => {
    setEditingTrackerId(id);
    setFormOpen(true);
  };

  const closeForm = () => {
    setEditingTrackerId(null);
    setFormOpen(false);
  };

  return (
    <TrackerContext.Provider
      value={{ formOpen, editingTrackerId, openCreateForm, openEditForm, closeForm }}
    >
      {children}
    </TrackerContext.Provider>
  );
};

export const useTrackerContext = (): TrackerContextType => {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error("useTrackerContext must be used within TrackerProvider");
  return ctx;
};
