import {
  Plus,
  Edit2,
  Trash2,
  List as ListIcon,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Navbar } from "../navigation/navbar";
import { Button, Page } from "../navigation";
import { useLists } from "./use-lists";
import { useListContext } from "./list-context";
import { useLanguageContext } from "../i18n/LanguageContext";
import type { List, ListCreateInput, ListUpdateInput } from "./types";

export default function Lists() {
  const { t } = useLanguageContext();
  const navigate = useNavigate();
  const { openListForm } = useListContext();
  const { lists, loading, initiated, error, deleteList, refreshLists } =
    useLists();

  const handleCreateList = () => {
    openListForm(); // Open create form
  };

  const handleEditList = (list: List) => {
    openListForm(list.id); // Open edit form with list ID
  };

  const handleDeleteList = async (list: List) => {
    if (!confirm(`Are you sure you want to delete "${list.name}"?`)) return;

    const success = await deleteList(list.id!);
    if (success) {
      refreshLists();
    }
  };

  const handleListClick = (list: List) => {
    navigate(`/list/${list.id}`);
  };

  return (
    <Page
      navbar={
        <Navbar
          title={t("lists") || "Lists"}
          rightAction={
            <Button onClick={handleCreateList}>
              <Plus size={20} />
              <span className="hidden sm:inline ml-2">
                {t("create_list") || "Create List"}
              </span>
            </Button>
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

      {!loading && initiated && lists.length === 0 && (
        <div className="text-center py-12">
          <ListIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("no_lists") || "No lists yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {t("no_lists_description") ||
              "Create your first list to organize your tasks."}
          </p>
          <Button onClick={handleCreateList}>
            <Plus size={20} className="mr-2" />
            {t("create_first_list") || "Create First List"}
          </Button>
        </div>
      )}

      {lists.length > 0 && (
        <div className="grid gap-4 p-4">
          {lists.map((list) => (
            <div
              key={list.id}
              onClick={() => handleListClick(list)}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <ListIcon />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{list.name}</h3>
                  </div>
                </div>
                <div
                  className="flex space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleEditList(list)}
                    className="p-1 text-gray-600 hover:text-gray-800"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteList(list)}
                    className="p-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
