import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Platform = "web" | "android";

const STORAGE_KEY = "hvsna-docs-platform";

interface PlatformContextValue {
  platform: Platform;
  setPlatform: (next: Platform) => void;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

function readStored(): Platform {
  if (typeof window === "undefined") return "web";
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "android" ? "android" : "web";
  } catch {
    return "web";
  }
}

/** Wraps the docs article so every <PlatformTabs> block on the page shares one
 *  Android/Web choice, persisted per visitor. */
export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatformState] = useState<Platform>("web");

  // Pull the stored choice after mount (the site does a fresh client render, not
  // hydration, so there's no SSR/client mismatch to worry about here).
  useEffect(() => {
    setPlatformState(readStored());
  }, []);

  const setPlatform = (next: Platform) => {
    setPlatformState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  return (
    <PlatformContext.Provider value={{ platform, setPlatform }}>
      {children}
    </PlatformContext.Provider>
  );
}

function usePlatform(): PlatformContextValue {
  const ctx = useContext(PlatformContext);
  if (ctx) return ctx;
  // Fallback so the components still render if used outside a provider.
  return { platform: "web", setPlatform: () => {} };
}

const TAB_LABELS: Record<Platform, string> = {
  web: "Web",
  android: "Android",
};

/** A tabbed block with a Web/Android switch. Put <Web> and <Android> inside.
 *  All PlatformTabs on a page switch together. */
export function PlatformTabs({ children }: { children: ReactNode }) {
  const { platform, setPlatform } = usePlatform();

  return (
    <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        role="tablist"
        aria-label="Platform"
        className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
      >
        {(["web", "android"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={platform === value}
            onClick={() => setPlatform(value)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              platform === value
                ? "text-primary-700 dark:text-primary-300 border-b-2 border-primary-600 -mb-px"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {TAB_LABELS[value]}
          </button>
        ))}
      </div>
      <div className="px-4 py-4 [&_[role=tabpanel]>*:last-child]:!mb-0">{children}</div>
    </div>
  );
}

function PlatformPanel({ only, children }: { only: Platform; children: ReactNode }) {
  const { platform } = usePlatform();
  return (
    <div role="tabpanel" hidden={platform !== only}>
      {children}
    </div>
  );
}

export function Web({ children }: { children: ReactNode }) {
  return <PlatformPanel only="web">{children}</PlatformPanel>;
}

export function Android({ children }: { children: ReactNode }) {
  return <PlatformPanel only="android">{children}</PlatformPanel>;
}
