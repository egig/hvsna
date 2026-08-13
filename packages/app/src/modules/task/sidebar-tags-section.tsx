import { useTags } from "./use-tags";
import { useLanguageContext } from "../i18n/LanguageContext";
import { Link } from "react-router";

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
    <div className="px-2 pt-3 pb-1">
      <div className="px-3 pb-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t("tags") || "Tags"}
        </span>
      </div>
      <div className="space-y-0.5">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            to={`/tags/${encodeURIComponent(tag.name)}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: tag.color }}
              aria-hidden
            />
            <span className="text-sm truncate flex-1">{tag.name}</span>
            <span className="text-xs text-gray-400">{tag.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
