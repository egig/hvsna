import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  HvList,
  HvEdit2,
  HvTrash2,
  HvMoreVertical,
  HvPlus,
} from "@/modules/icons";
import { Menu } from "@base-ui/react/menu";
import { Navbar } from "../navigation/navbar";
import { Page } from "../navigation";
import { useProjects } from "./use-projects";
import { useProjectTasks } from "./use-project-tasks";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useProjectContext } from "./project-context";
import { DeleteProjectModal } from "./delete-project-modal";
import { ProjectEvaluationCard } from "./project-evaluation-card";
import { ProjectEvaluationPicker } from "./project-evaluation-picker";
import type { Project, Task, TrackerEvaluationRef } from "./types";
import TaskListItem from "./task-list-item";
import { useTaskContext } from "./task-context";
import { useScreenSize } from "../system";

export default function ProjectDetail() {
  const { t } = useLanguageContext();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { openEditTaskForm } = useTaskContext();
  const { openProjectForm } = useProjectContext();
  const { isDesktop } = useScreenSize();

  const {
    projects,
    loading: listsLoading,
    error: listsError,
    getProject,
    updateProject,
    deleteProject,
    updating: isUpdatingProject,
  } = useProjects();

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    refreshTasks,
  } = useProjectTasks({ projectId: projectId || "", enabled: !!projectId });

  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleEditProject = () => {
    if (currentProject) {
      openProjectForm(currentProject.id);
    }
  };

  const handleDeleteProject = () => {
    if (!currentProject) {
      return;
    }

    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async (deleteTasks: boolean) => {
    if (!currentProject) {
      return;
    }

    const success = await deleteProject(currentProject.id!, deleteTasks);
    if (success) {
      setShowDeleteModal(false);
      navigate("/browse");
    }
  };

  const handleAddRefs = useCallback(
    async (newRefs: TrackerEvaluationRef[]) => {
      if (!currentProject?.id) return;
      const currentRefs = currentProject.trackerEvaluationRefs || [];
      const merged = [...currentRefs, ...newRefs];
      await updateProject(currentProject.id, {
        trackerEvaluationRefs: merged,
      });
      // Refresh project data
      const updated = await getProject(currentProject.id);
      if (updated) setCurrentProject(updated);
    },
    [currentProject, updateProject, getProject]
  );

  const handleRemoveRef = useCallback(
    async (index: number) => {
      if (!currentProject?.id) return;
      const currentRefs = currentProject.trackerEvaluationRefs || [];
      const filtered = currentRefs.filter((_, i) => i !== index);
      await updateProject(currentProject.id, {
        trackerEvaluationRefs: filtered,
      });
      // Refresh project data
      const updated = await getProject(currentProject.id);
      if (updated) setCurrentProject(updated);
    },
    [currentProject, updateProject, getProject]
  );

  // Load list details
  useEffect(() => {
    if (projectId) {
      getProject(projectId).then(setCurrentProject);
    }
  }, [projectId, getProject]);

  // Reload list when update completes
  useEffect(() => {
    if (!isUpdatingProject && projectId && currentProject) {
      // Reload the list after an update operation completes
      getProject(projectId).then(setCurrentProject);
    }
  }, [isUpdatingProject, projectId, currentProject, getProject, projects]);

  if (listsLoading) {
    return (
      <Page navbar={<Navbar title={t("loading") || "Loading..."} />}>
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">{t("loading") || "Loading..."}</div>
        </div>
      </Page>
    );
  }

  if (listsError) {
    return (
      <Page navbar={<Navbar title={t("error") || "Error"} />}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded m-4">
          {listsError}
        </div>
      </Page>
    );
  }

  if (!currentProject) {
    return (
      <Page
        navbar={
          <Navbar title={t("project_not_found") || "Project Not Found"} />
        }
      >
        <div className="text-center py-12">
          <HvList size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("project_not_found") || "Project Not Found"}
          </h3>
          <p className="text-gray-500 mb-4">
            {t("project_not_found_description") ||
              "The list you're looking for doesn't exist or has been deleted."}
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page
      navbar={
        <Navbar
          title={currentProject.name}
          rightAction={
            !isDesktop && (
              <Menu.Root>
                <Menu.Trigger
                  className="w-10 h-10 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center transition-colors"
                  aria-label="More options"
                >
                  <HvMoreVertical size={20} />
                </Menu.Trigger>

                <Menu.Portal>
                  <Menu.Positioner className="z-[9999]">
                    <Menu.Popup className="z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-auto">
                      <Menu.Item
                        onClick={handleEditProject}
                        className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer pointer-events-auto"
                      >
                        <HvEdit2 size={18} />
                        {t("edit_project")}
                      </Menu.Item>
                      <Menu.Item
                        onClick={handleDeleteProject}
                        className="px-4 py-3 text-left hover:text-[var(--hvsna-danger-color-hover)] text-[var(--hvsna-danger-color)] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer pointer-events-auto"
                      >
                        <HvTrash2 size={18} />
                        {t("delete_project")}
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            )
          }
        />
      }
    >
      {currentProject.description && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {currentProject.description}
          </p>
        </div>
      )}

      {/* Evaluation Dashboard */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t("linked_evaluations") || "Linked Evaluations"}
          </span>
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1 text-xs text-[var(--hvsna-primary-color)] font-medium"
          >
            <HvPlus size={14} />
            {t("link") || "Link"}
          </button>
        </div>

        {(currentProject.trackerEvaluationRefs || []).length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 py-2">
            {t("no_linked_evaluations") ||
              "No tracker evaluations linked. Tap + to link one."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(currentProject.trackerEvaluationRefs || []).map((ref, index) => (
              <ProjectEvaluationCard
                key={`${ref.trackerId}-${ref.evaluationId}`}
                ref={ref}
                onRemove={() => handleRemoveRef(index)}
              />
            ))}
          </div>
        )}
      </div>

      {tasksLoading && (
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">
            {t("loading_tasks") || "Loading tasks..."}
          </div>
        </div>
      )}

      {tasksError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded m-4">
          {tasksError}
        </div>
      )}

      {!tasksLoading && tasks.length === 0 && (
        <div className="text-center py-12">
          <HvList size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("no_tasks_in_project") || "No Tasks in Project"}
          </h3>
          <p className="text-gray-500 mb-4">
            {t("no_tasks_in_project_description") ||
              "There are no tasks in this list yet. Create your first task to get started."}
          </p>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="tasks-scroll-container">
          {tasks.map((task: Task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onEdit={() => openEditTaskForm(task.id as string)}
              showDateTime={true}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteProjectModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteProject}
        projectName={currentProject?.name || ""}
        tasks={tasks}
      />

      {/* Evaluation Picker */}
      <ProjectEvaluationPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handleAddRefs}
        existingRefs={currentProject.trackerEvaluationRefs || []}
      />
    </Page>
  );
}
