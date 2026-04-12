import { useState, useMemo } from "react";
import { HvSearch } from "@/modules/icons";
import { Modal } from "../navigation";
import { ALL_TIMEZONES } from "../timezones";

interface TimezonePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onSelect: (tz: string) => void;
  title?: string;
}

export function TimezonePickerModal({
  isOpen,
  onClose,
  value,
  onSelect,
  title = "Select Timezone",
}: TimezonePickerModalProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_TIMEZONES;
    return ALL_TIMEZONES.filter((tz) =>
      tz.replace(/_/g, " ").toLowerCase().includes(q),
    );
  }, [search]);

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  const handleSelect = (tz: string) => {
    onSelect(tz);
    setSearch("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} noPadding data-testid="timezone-modal">
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <HvSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search timezones..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] focus:border-[var(--hvsna-primary-color)]"
              autoFocus
            />
          </div>
        </div>
        <ul className="overflow-y-auto h-72">
          {filtered.length === 0 ? (
            <li className="p-4 text-sm text-gray-500 text-center">
              No timezones found
            </li>
          ) : (
            filtered.map((tz) => (
              <li key={tz}>
                <button
                  type="button"
                  onClick={() => handleSelect(tz)}
                  data-testid={`timezone-option-${tz.replace(/[^a-zA-Z0-9]/g, '')}`}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${
                    tz === value
                      ? "font-semibold text-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/5"
                      : "text-gray-800"
                  }`}
                >
                  {tz.replace(/_/g, " ")}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </Modal>
  );
}
