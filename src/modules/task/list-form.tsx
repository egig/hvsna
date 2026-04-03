import { Button } from "src/modules/components/button";
import { useLanguageContext } from "../i18n/LanguageContext";

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
}

const defaultColors = [
  "#2e335a",
  "#a8496a",
  "#6366f1",
  "#818cf8",
  "#3b82f6",
  "#06b6d4",
  "#cc8f3c",
  "#84cc16",
];

export default function ListForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEdit = false,
}: ListFormProps) {
  const { t } = useLanguageContext();

  return (
    <form onSubmit={onSubmit} className="p-4">
      <h3 className="text-lg font-semibold mb-4">
        {isEdit
          ? t("edit_list") || "Edit List"
          : t("create_list") || "Create List"}
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("name") || "Name"} *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          placeholder={t("list_name") || "List name"}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("description") || "Description"}
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder={t("list_description") || "List description"}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          {t("cancel") || "Cancel"}
        </button>
        <Button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isEdit ? t("update") || "Update" : t("create") || "Create"}
        </Button>
      </div>
    </form>
  );
}
