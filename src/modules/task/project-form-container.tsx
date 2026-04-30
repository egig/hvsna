import { useState, useEffect } from "react";
import { useProjectContext } from "./project-context";
import { useProjects } from "./use-projects";
import ProjectForm from "./project-form";
import type { Project, ProjectCreateInput, ProjectUpdateInput } from "./types";
import { useLanguageContext } from "../i18n/LanguageContext";

interface ProjectFormData {
  name: string;
  description: string;
  color: string;
}

export default function ProjectFormContainer() {
  const { t } = useLanguageContext();
  const { editingProjectId, closeProjectForm } = useProjectContext();
  const { getProject, createProject, updateProject } = useProjects();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    color: "#2e335a",
  });

  // Load project data when editing
  useEffect(() => {
    if (editingProjectId) {
      loadProject();
    } else {
      resetForm();
    }
  }, [editingProjectId]);

  const loadProject = async () => {
    if (!editingProjectId) return;

    try {
      setLoading(true);
      const projectData = await getProject(editingProjectId);
      if (projectData) {
        setProject(projectData);
        setFormData({
          name: projectData.name || "",
          description: projectData.description || "",
          color: projectData.color || "#3B82F6",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProject(null);
    setFormData({
      name: "",
      description: "",
      color: "#2e335a",
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingProjectId && project) {
        // Update existing project
        const updateInput: ProjectUpdateInput = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
        };

        await updateProject(editingProjectId, updateInput);
      } else {
        // Create new project
        const createInput: ProjectCreateInput = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
        };

        await createProject(createInput);
      }

      closeProjectForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    closeProjectForm();
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">{t("loading") || "Loading..."}</div>
        </div>
      </div>
    );
  }

  return (
    <ProjectForm
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isEdit={!!editingProjectId}
      isSubmitting={loading}
    />
  );
}
