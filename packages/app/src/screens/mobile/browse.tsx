import {
  HvSettings,
  HvHash,
  HvSquareCheck,
  HvReplayCircle,
} from "@/modules/icons";
import { Navbar } from "../../modules/navigation/navbar";
import { Button } from "../../modules/navigation";
import { useLanguageContext } from "../../modules/i18n/LanguageContext";
import { MenuItem } from "../../modules/components/menu-item";
import { useTags } from "../../modules/task/use-tags";
import BlockTitle from "../../modules/components/block-title";
import { Page } from "./page";

export default function Browse() {
  const { t } = useLanguageContext();
  const { tags } = useTags();

  return (
    <Page
      navbar={
        <Navbar
          title={""}
          showBackButton={false}
          rightAction={
            <Button to={"/settings"} className="text-gray-500">
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
            icon={HvSquareCheck}
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
