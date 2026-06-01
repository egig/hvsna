import {
  HvSettings,
  HvHash,
  HvCheckSquare2,
  HvReplayCircle,
} from "@/modules/icons";
import { Navbar } from "../navigation/navbar";
import { Button, Page } from "../navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import { MenuItem } from "../components/menu-item";
import { useTags } from "./use-tags";
import BlockTitle from "../components/block-title";

export default function Browse() {
  const { t } = useLanguageContext();
  const { tags } = useTags();

  return (
    <Page
      navbar={
        <Navbar
          title={t("browse")}
          showBackButton={false}
          rightAction={
            <Button to={"/settings"}>
              <HvSettings />
            </Button>
          }
        />
      }
    >
      <div className="min-h-full bg-gray-100 dark:bg-gray-900 px-4 py-4 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
          <MenuItem
            icon={HvReplayCircle}
            title={t("recurring") || "Recurring"}
            to="/recurring"
          />
          <MenuItem
            icon={HvCheckSquare2}
            title={t("completed") || "Completed"}
            to="/completed"
          />
        </div>

        {tags.length > 0 && (
          <div>
            <BlockTitle>Tags</BlockTitle>
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
              {tags.map((tag) => (
                <MenuItem
                  key={tag.name}
                  icon={HvHash}
                  title={tag.name}
                  badge={
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {tag.count}
                    </span>
                  }
                  to={`/tags/${encodeURIComponent(tag.name)}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
