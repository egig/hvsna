import { useRef, useEffect } from "react";
import { HvArrowUp, HvCheck, HvX } from "@/modules/icons";
import { NavActionButton } from "../components/nav-action-button";
import { Navbar } from "../navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useScreenSize } from "../components/screen-size-wrapper";

interface ProjectFormData {
  name: string;
  description: string;
  color: string;
}

interface ProjectFormProps {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

export default function ProjectForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEdit = false,
  isSubmitting = false,
}: ProjectFormProps) {
  const { t } = useLanguageContext();
  const { isDesktop } = useScreenSize();
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const title = isEdit
    ? t("edit_project") || "Edit Project"
    : t("create_project") || "Create Project";

  const fields = (
    <>
      <input
        ref={nameInputRef}
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="text-base font-medium outline-none px-4 py-2 text-lg w-full"
        required
        disabled={isSubmitting}
        placeholder={t("project_name") || "Project name"}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-label={t("name") || "Name"}
      />
      <textarea
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        className="text-sm px-4 h-[3rem] py-2 w-full outline-none resize-none"
        disabled={isSubmitting}
        placeholder={t("project_description") || "Project description"}
        style={{ resize: "none" }}
      />
    </>
  );

  if (isDesktop) {
    return (
      <form className="h-full" onSubmit={onSubmit}>
        <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
        </div>

        {fields}

        <div className="flex justify-end gap-2 p-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
          >
            {t("cancel") || "Cancel"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-md shadow-sm flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {isEdit ? t("update") || "Update" : t("create") || "Create"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      className="h-full mb-4 pb-[env(safe-area-inset-bottom)]"
      onSubmit={onSubmit}
    >
      <Navbar
        title={title}
        modal
        showBackButton={false}
        leftAction={
          <NavActionButton
            variant="neutral"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label={t("cancel") || "Cancel"}
          >
            <HvX />
          </NavActionButton>
        }
        rightAction={
          <NavActionButton
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            className="shadow-lg z-50"
            aria-label={
              isEdit ? t("update") || "Update" : t("create") || "Create"
            }
          >
            <HvCheck />
          </NavActionButton>
        }
      />

      {fields}
    </form>
  );
}
