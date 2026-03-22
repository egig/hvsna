import { useLanguageContext } from "../i18n/LanguageContext";

interface List {
  id: string;
  name: string;
}

interface ListSelectorProps {
  lists: List[];
  selectedListId: string;
  onListChange: (listId: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function ListSelector({
  lists,
  selectedListId,
  onListChange,
  disabled = false,
  className = "",
  placeholder,
}: ListSelectorProps) {
  const { t } = useLanguageContext();

  return (
    <div className={`w-fit ${className}`}>
      <select
        value={selectedListId}
        onChange={(e) => onListChange(e.target.value)}
        disabled={disabled}
        className={
          "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 " +
          (selectedListId
            ? "text-gray-900 dark:text-white"
            : "text-gray-500 dark:text-gray-400")
        }
      >
        <option value="">{placeholder || t("no_list")}</option>
        {lists.map((list) => (
          <option key={list.id} value={list.id}>
            {list.name}
          </option>
        ))}
      </select>
    </div>
  );
}
