import { useState, useEffect, useRef } from "react";
import { HvSearch } from "@/modules/icons";
import { Modal } from "../navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import { searchLocations } from "@/infra/location/nominatim";

export type Location = {
  name: string;
  lat: number;
  lng: number;
};

async function searchNominatim(query: string): Promise<Location[]> {
  const data = await searchLocations(query);
  return data.map((r) => ({
    name: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}

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
  const { t } = useLanguageContext();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setResults([]);
      setError(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const locations = await searchNominatim(q);
        setResults(locations);
      } catch {
        setError(true);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const handleClose = () => {
    setSearch("");
    setResults([]);
    onClose();
  };

  const handleSelect = (l: Location) => {
    onSelect(l);
    setSearch("");
    setResults([]);
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
        {!value && (
          <div className="px-4 py-3 bg-warning-50 border-b border-warning-100 text-warning-700 text-sm">
            {t("location_not_detected")}
          </div>
        )}
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
          {loading ? (
            <li className="p-4 text-sm text-gray-400 text-center">
              Searching…
            </li>
          ) : error ? (
            <li className="p-4 text-sm text-red-400 text-center">
              Search failed. Check your connection.
            </li>
          ) : results.length === 0 ? (
            <li className="p-4 text-sm text-gray-500 text-center">
              No locations found
            </li>
          ) : (
            results.map((l) => (
              <li key={`${l.lat},${l.lng}`}>
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
                  {l.name}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </Modal>
  );
}
