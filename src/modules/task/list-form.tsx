import { useRef, useEffect } from "react";
import { HvArrowUp, HvX } from "@/modules/icons";
import { Navbar } from "../navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useScreenSize } from "../components/screen-size-wrapper";

interface ListFormData {
  name: string;
  description: string;
  color: string;
}

interface ListFormProps {
  formData: ListFormData;
  setFormData: (data: ListFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

export default function ListForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEdit = false,
  isSubmitting = false,
}: ListFormProps) {
  const { t } = useLanguageContext();
  const { isDesktop } = useScreenSize();
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const title = isEdit
    ? t("edit_list") || "Edit List"
    : t("create_list") || "Create List";

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
        placeholder={t("list_name") || "List name"}
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
        placeholder={t("list_description") || "List description"}
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
        showBackButton={false}
        leftAction={
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-colors disabled:opacity-50"
            aria-label={t("cancel") || "Cancel"}
          >
            <HvX />
          </button>
        }
        rightAction={
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-12 h-12 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50 disabled:opacity-50"
            aria-label={
              isEdit ? t("update") || "Update" : t("create") || "Create"
            }
          >
            <HvArrowUp />
          </button>
        }
      />

      {fields}
    </form>
  );
}
