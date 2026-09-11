import { useTags } from "./use-tags";
import { useLanguageContext } from "../i18n/LanguageContext";
import { NavLink } from "react-router";
import { HvHash } from "@/modules/icons";

interface SidebarTagsSectionProps {
  collapsed?: boolean;
}

export function SidebarTagsSection({
  collapsed = false,
}: SidebarTagsSectionProps) {
  const { t } = useLanguageContext();
  const { tags } = useTags({ limit: 300 });

  if (collapsed || tags.length === 0) return null;

  return (
    <div className="pt-3 pb-1">
      <div className="px-3 pb-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t("tags") || "Tags"}
        </span>
      </div>
      <div className="space-y-0.5">
        {tags.map((tag) => (
          <NavLink
            key={tag.id}
            to={`/tags/${encodeURIComponent(tag.name)}`}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 transition-colors ${
                isActive
                  ? "bg-gray-200 dark:bg-gray-800"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`
            }
          >
            <span style={{color: tag.color }} className="text-sm truncate flex-1">#{tag.name}</span>
            {tag.count > 0 && <span className="text-xs text-gray-400">{tag.count }</span> }
          </NavLink>
        ))}
      </div>
    </div>
  );
}
