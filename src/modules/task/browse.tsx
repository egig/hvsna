import { HvPlus, HvList, HvSettings, HvSearch } from "@src/modules/icons";
import { useNavigate } from "react-router";
import { Navbar } from "../navigation/navbar";
import { Button, Link, Page } from "../navigation";
import { Button as Button2 } from "../components/button";
import { useLists } from "./use-lists";
import { useListContext } from "./list-context";
import { useLanguageContext } from "../i18n/LanguageContext";
import type { List, ListCreateInput, ListUpdateInput } from "./types";
import { MenuItem } from "../components/menu-item";

export default function Browse() {
  const { t } = useLanguageContext();
  const navigate = useNavigate();
  const { openListForm } = useListContext();
  const { lists, loading, initiated, error, refreshLists } = useLists();

  const handleCreateList = () => {
    openListForm(); // Open create form
  };

  const handleGoToSettings = () => {
    navigate("/settings");
  };

  const handleListClick = (list: List) => {
    navigate(`/list/${list.id}`);
  };

  return (
    <Page
      navbar={
        <Navbar
          title={t("browse")}
          showBackButton={false}
          rightAction={
            <Link to="/settings">
              <HvSettings size={20} />
              <span className="hidden sm:inline ml-2">
                {t("settings") || "Settings"}
              </span>
            </Link>
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
      <div className="mb-6">
        <MenuItem icon={HvSearch} title={t("search") || "Search"} to="/tasks" />
      </div>

      {!loading && initiated && lists.length === 0 && (
        <div className="text-center py-12">
          <HvList size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("no_lists") || "No lists yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {t("no_lists_description") ||
              "Create your first list to organize your tasks."}
          </p>
          <Button2 onClick={handleCreateList}>
            <HvPlus size={20} />
            <span className="">{t("create_list") || "Create List"}</span>
          </Button2>
        </div>
      )}

      {lists.length > 0 && (
        <div>
          <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              {t("lists") || "Lists"}
            </h3>
            <Button onClick={handleCreateList}>
              <HvPlus size={20} />
            </Button>
          </div>
          {lists.map((list) => (
            <MenuItem
              key={list.id}
              title={list.name || ""}
              to={`/list/${list.id}`}
              showChevron={true}
            />
          ))}
        </div>
      )}
    </Page>
  );
}
