import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface ProjectContextType {
  // Form state management
  editingProjectId: string | null;
  formOpen: boolean;
  openProjectForm: (projectId?: string) => void;
  closeProjectForm: () => void;
  setEditingProjectId: (projectId: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  // Local form state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState<boolean>(false);

  // Local form functions
  const openProjectForm = (projectId?: string) => {
    setEditingProjectId(projectId || null);
    setFormOpen(true);
  };

  const closeProjectForm = () => {
    setEditingProjectId(null);
    setFormOpen(false);
  };

  const contextValue: ProjectContextType = {
    editingProjectId,
    formOpen,
    openProjectForm,
    closeProjectForm,
    setEditingProjectId,
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
};
