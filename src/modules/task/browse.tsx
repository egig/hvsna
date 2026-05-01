import { HvPlus, HvList, HvSettings, HvSearch, HvTag, HvOutlineInbox } from "@/modules/icons";
import { useNavigate } from "react-router";
import { Navbar } from "../navigation/navbar";
import { Button, Page } from "../navigation";
import { NavActionButton } from "../components/nav-action-button";
import { Button as Button2 } from "../components/button";
import { useProjects } from "./use-projects";
import { useProjectContext } from "./project-context";
import { useLanguageContext } from "../i18n/LanguageContext";
import type { Project } from "./types";
import { MenuItem } from "../components/menu-item";

export default function Browse() {
  const { t } = useLanguageContext();
  const navigate = useNavigate();
  const { openProjectForm } = useProjectContext();
  const { projects, loading, initiated, error } = useProjects();

  const handleCreateProject = () => {
    openProjectForm();
  };

  const handleGoToSettings = () => {
    navigate("/settings");
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/project/${project.id}`);
  };

  return (
    <Page
      navbar={
        <Navbar
          title={t("browse")}
          showBackButton={false}
          rightAction={
            <NavActionButton
              variant="neutral"
              onClick={handleGoToSettings}
              aria-label={t("settings") || "Settings"}
            >
              <HvSettings size={20} />
            </NavActionButton>
          }
        />
      }
    >
      {loading && !initiated && (
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">{t("loading") || "Loading..."}</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Navigation Menu Items */}
      <div className="mb-6 space-y-1">
        <MenuItem icon={HvSearch} title={t("search") || "Search"} to="/search" />
        <MenuItem icon={HvTag} title={t("tags") || "Tags"} to="/tags" />
      </div>

      {!loading && initiated && projects.length === 0 && (
        <div className="text-center py-12">
          <HvList size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("no_projects") || "No projects yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {t("no_projects_description") ||
              "Create your first project to organize your tasks."}
          </p>
          <Button2 onClick={handleCreateProject}>
            <HvPlus size={20} />
            <span className="">{t("create_project") || "Create Project"}</span>
          </Button2>
        </div>
      )}

      {projects.length > 0 && (
        <div>
          <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              {t("projects") || "Projects"}
            </h3>
            <Button onClick={handleCreateProject}>
              <HvPlus size={20} />
            </Button>
          </div>
          {projects.map((project) => (
            <MenuItem
              key={project.id}
              title={project.name || ""}
              to={`/project/${project.id}`}
              showChevron={true}
            />
          ))}
        </div>
      )}
    </Page>
  );
}
