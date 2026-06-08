import { createContext, useContext, useState, useCallback } from "react";
import dayjs from "dayjs";

interface MockTimeContextValue {
  mockTime: Date | null;
  setMockTime: (date: Date | null) => void;
  now: () => Date;
}

const STORAGE_KEY = "hvsna_mock_time";

const MockTimeContext = createContext<MockTimeContextValue>({
  mockTime: null,
  setMockTime: () => {},
  now: () => new Date(),
});

export function MockTimeProvider({ children }: { children: React.ReactNode }) {
  const [mockTime, setMockTimeState] = useState<Date | null>(() => {
    if (!import.meta.env.DEV) return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const d = new Date(stored);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  });

  const setMockTime = useCallback((date: Date | null) => {
    setMockTimeState(date);
    if (date) {
      localStorage.setItem(STORAGE_KEY, date.toISOString());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const now = useCallback(() => mockTime ?? new Date(), [mockTime]);

  return (
    <MockTimeContext.Provider value={{ mockTime, setMockTime, now }}>
      {children}
    </MockTimeContext.Provider>
  );
}

export function useMockTime() {
  return useContext(MockTimeContext);
}

export function MockTimeControl() {
  const { mockTime, setMockTime } = useMockTime();
  const [open, setOpen] = useState(false);

  if (!import.meta.env.DEV) return null;

  const isActive = mockTime != null;
  const value = isActive ? dayjs(mockTime).format("YYYY-MM-DDTHH:mm") : "";

  return (
    <div className="fixed bottom-24 left-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="bg-white border border-amber-200 rounded-xl shadow-lg p-3 flex flex-col gap-2 w-56">
          <span className="text-xs font-bold text-amber-700">Mock time</span>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => {
              if (e.target.value) setMockTime(new Date(e.target.value));
            }}
            className="border border-amber-300 rounded px-2 py-1 text-xs bg-white w-full"
          />
          {isActive && (
            <button
              onClick={() => {
                setMockTime(null);
                setOpen(false);
              }}
              className="text-xs text-left text-red-500 hover:text-red-700"
            >
              Clear → use real time
            </button>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-md border transition-colors ${
          isActive
            ? "bg-amber-400 border-amber-500 text-white"
            : "bg-white border-amber-300 text-amber-600"
        }`}
      >
        {isActive ? `⏱ ${dayjs(mockTime).format("HH:mm")}` : "⏱ DEV"}
      </button>
    </div>
  );
}
