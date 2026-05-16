import { useState, useMemo } from "react";
import { HvSearch } from "@/modules/icons";
import { Modal } from "../navigation";

export type Location = {
  name: string;
  lat: number;
  lng: number;
};

const offlineLocations: Location[] = [
  {
    name: "Jakarta Area, Indonesia",
    lat: 6.2001514,
    lng: 106.829547,
  },
];

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onSelect: (l: Location) => void;
  title?: string;
  dismissable?: boolean;
}

export function LocationPickerModal({
  isOpen,
  onClose,
  value,
  onSelect,
  title = "Select Location",
  dismissable,
}: LocationPickerModalProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return offlineLocations;
    return offlineLocations.filter((l) =>
      l.name.replace(/_/g, " ").toLowerCase().includes(q)
    );
  }, [search]);

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  const handleSelect = (l: Location) => {
    onSelect(l);
    setSearch("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      noPadding
      data-testid="timezone-modal"
      dismissable={dismissable}
    >
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <HvSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search locations..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] focus:border-[var(--hvsna-primary-color)]"
              autoFocus
            />
          </div>
        </div>
        <ul className="overflow-y-auto h-72">
          {filtered.length === 0 ? (
            <li className="p-4 text-sm text-gray-500 text-center">
              No locations found
            </li>
          ) : (
            filtered.map((l) => (
              <li key={l.name}>
                <button
                  type="button"
                  onClick={() => handleSelect(l)}
                  data-testid={`location-option-${l.name.replace(
                    /[^a-zA-Z0-9]/g,
                    ""
                  )}`}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${
                    l.name === value
                      ? "font-semibold text-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/5"
                      : "text-gray-800"
                  }`}
                >
                  {l.name.replace(/_/g, " ")}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </Modal>
  );
}
