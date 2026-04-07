import { useState, useEffect } from "react";
import { useListContext } from "./list-context";
import { useLists } from "./use-lists";
import ListForm from "./list-form";
import type { List, ListCreateInput, ListUpdateInput } from "./types";
import { useLanguageContext } from "../i18n/LanguageContext";

interface ListFormData {
  name: string;
  description: string;
  color: string;
}

export default function ListFormContainer() {
  const { t } = useLanguageContext();
  const { editingListId, closeListForm } = useListContext();
  const { getList, createList, updateList } = useLists();

  const [list, setList] = useState<List | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ListFormData>({
    name: "",
    description: "",
    color: "#2e335a",
  });

  // Load list data when editing
  useEffect(() => {
    if (editingListId) {
      loadList();
    } else {
      resetForm();
    }
  }, [editingListId]);

  const loadList = async () => {
    if (!editingListId) return;

    try {
      setLoading(true);
      const listData = await getList(editingListId);
      if (listData) {
        setList(listData);
        setFormData({
          name: listData.name || "",
          description: listData.description || "",
          color: listData.color || "#3B82F6",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load list");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setList(null);
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
      setError("List name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingListId && list) {
        // Update existing list
        const updateInput: ListUpdateInput = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
        };

        await updateList(editingListId, updateInput);
      } else {
        // Create new list
        const createInput: ListCreateInput = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
        };

        await createList(createInput);
      }

      closeListForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save list");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    closeListForm();
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
    <ListForm
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isEdit={!!editingListId}
      isSubmitting={loading}
    />
  );
}
