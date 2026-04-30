import { useLanguageContext } from "../i18n/LanguageContext";

interface Project {
  id: string;
  name: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onProjectChange,
  disabled = false,
  className = "",
  placeholder,
}: ProjectSelectorProps) {
  const { t } = useLanguageContext();

  return (
    <div className={`w-fit ${className}`}>
      <select
        value={selectedProjectId}
        onChange={(e) => onProjectChange(e.target.value)}
        disabled={disabled}
        className={
          "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 " +
          (selectedProjectId
            ? "text-gray-900 dark:text-white"
            : "text-gray-500 dark:text-gray-400")
        }
      >
        <option value="">{placeholder || t("no_project")}</option>
        {projects.map((proj) => (
          <option key={proj.id} value={proj.id}>
            {proj.name}
          </option>
        ))}
      </select>
    </div>
  );
}
