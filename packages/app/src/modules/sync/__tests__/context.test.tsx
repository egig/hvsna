import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { SyncProvider, useSync } from "../context";
import { createWriteNotifier } from "../write-notifier";

const mockFullSync = vi.fn();
let mockIsAuthenticated = false;
let mockEmailVerified = false;
let mockIsOnline = true;
const mockWriteNotifier = createWriteNotifier();

vi.mock("@/modules/sqlite/context", () => ({
  useSqliteClient: () => ({ client: {} }),
}));
vi.mock("@/modules/network/context", () => ({
  useNetworkContext: () => ({ isOnline: mockIsOnline }),
}));
vi.mock("@/modules/repositories-context", () => ({
  useRepositories: () => ({ writeNotifier: mockWriteNotifier }),
}));
vi.mock("@/modules/auth", () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: mockIsAuthenticated ? { emailVerified: mockEmailVerified } : null,
  }),
}));
vi.mock("@/modules/settings", () => ({
  useSettings: () => ({ setSettings: vi.fn() }),
}));
vi.mock("@/modules/settings/use-settings-repository", () => ({
  useSettingsRepository: () => ({ load: vi.fn().mockResolvedValue({}) }),
}));
vi.mock("@/modules/settings/settings-defaults", () => ({
  withDefaults: (settings: unknown) => settings,
}));
vi.mock("@/modules/task/use-invalidate-task-queries", () => ({
  useInvalidateTaskQueries: () => vi.fn(),
}));
vi.mock("@/infra/sync/SyncApiClientFactory", () => ({
  getSyncApiClient: () => ({}),
}));
vi.mock("../cursor-store", () => ({
  getLastSuccessAt: vi.fn().mockResolvedValue(null),
}));
vi.mock("../sync-engine", () => ({
  createSyncEngine: () => ({ fullSync: mockFullSync }),
}));

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(SyncProvider, null, children);

/** Signs in with a verified email and waits for the resulting initial sync to complete. */
async function signIn(rerender: () => void) {
  mockIsAuthenticated = true;
  mockEmailVerified = true;
  rerender();
  await flushMicrotasks();
}

describe("SyncProvider poll trigger", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFullSync.mockReset().mockResolvedValue(false);
    mockIsAuthenticated = false;
    mockEmailVerified = false;
    mockIsOnline = true;
    setVisibility("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not poll before the initial sync has run", async () => {
    renderHook(() => useSync(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });

    expect(mockFullSync).not.toHaveBeenCalled();
  });

  it("polls every 30s once signed in and the initial sync has completed", async () => {
    const { result, rerender } = renderHook(() => useSync(), { wrapper });

    await signIn(rerender);
    expect(result.current.initialSyncPerformed).toBe(true);
    mockFullSync.mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(mockFullSync).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(mockFullSync).toHaveBeenCalledTimes(2);
  });

  it("skips a poll tick while the tab is hidden, and syncs immediately on becoming visible again", async () => {
    const { result, rerender } = renderHook(() => useSync(), { wrapper });

    await signIn(rerender);
    expect(result.current.initialSyncPerformed).toBe(true);
    mockFullSync.mockClear();

    setVisibility("hidden");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(mockFullSync).not.toHaveBeenCalled();

    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await flushMicrotasks();
    expect(mockFullSync).toHaveBeenCalledTimes(1);
  });

  it("does not flip isSyncing for a poll tick, only for manual sync", async () => {
    const { result, rerender } = renderHook(() => useSync(), { wrapper });

    await signIn(rerender);
    mockFullSync.mockClear();
    mockFullSync.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(false), 5_000))
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    // The poll tick's fullSync is still in flight (resolves at +5s within the
    // tick), but isSyncing must never have been set for it.
    expect(result.current.isSyncing).toBe(false);
  });

  it("stops polling after sign-out", async () => {
    const { result, rerender } = renderHook(() => useSync(), { wrapper });

    await signIn(rerender);
    expect(result.current.initialSyncPerformed).toBe(true);
    mockFullSync.mockClear();

    mockIsAuthenticated = false;
    rerender();
    await flushMicrotasks();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });
    expect(mockFullSync).not.toHaveBeenCalled();
  });

  it("does not sync a signed-in user whose email isn't verified yet", async () => {
    const { result, rerender } = renderHook(() => useSync(), { wrapper });

    mockIsAuthenticated = true;
    mockEmailVerified = false;
    rerender();
    await flushMicrotasks();

    expect(result.current.initialSyncPerformed).toBe(false);
    expect(mockFullSync).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });
    expect(mockFullSync).not.toHaveBeenCalled();
  });

  it("starts syncing once an already-signed-in user verifies their email", async () => {
    const { result, rerender } = renderHook(() => useSync(), { wrapper });

    mockIsAuthenticated = true;
    mockEmailVerified = false;
    rerender();
    await flushMicrotasks();
    expect(mockFullSync).not.toHaveBeenCalled();

    mockEmailVerified = true;
    rerender();
    await flushMicrotasks();

    expect(result.current.initialSyncPerformed).toBe(true);
    expect(mockFullSync).toHaveBeenCalledTimes(1);
  });

  it("rejects manualSync for an unverified user without calling fullSync", async () => {
    const { result, rerender } = renderHook(() => useSync(), { wrapper });

    mockIsAuthenticated = true;
    mockEmailVerified = false;
    rerender();
    await flushMicrotasks();

    await expect(
      act(async () => {
        await result.current.manualSync();
      })
    ).rejects.toThrow(/verify your email/i);
    expect(mockFullSync).not.toHaveBeenCalled();
  });
});

describe("SyncProvider write trigger", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFullSync.mockReset().mockResolvedValue(false);
    mockIsAuthenticated = true;
    mockEmailVerified = true;
    mockIsOnline = true;
    setVisibility("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires a sync 1500ms after a single write, not before", async () => {
    renderHook(() => useSync(), { wrapper });
    await flushMicrotasks();
    mockFullSync.mockClear();

    act(() => {
      mockWriteNotifier.notify("tasks");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(mockFullSync).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(mockFullSync).toHaveBeenCalledTimes(1);
  });

  it("collapses a burst of writes into a single sync, 1500ms after the last one", async () => {
    renderHook(() => useSync(), { wrapper });
    await flushMicrotasks();
    mockFullSync.mockClear();

    act(() => {
      mockWriteNotifier.notify("tasks");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    act(() => {
      mockWriteNotifier.notify("tasks");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    act(() => {
      mockWriteNotifier.notify("tasks");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(mockFullSync).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(mockFullSync).toHaveBeenCalledTimes(1);
  });

  it("does not fire when canSync is false", async () => {
    mockIsAuthenticated = false;
    mockEmailVerified = false;
    renderHook(() => useSync(), { wrapper });
    await flushMicrotasks();
    mockFullSync.mockClear();

    act(() => {
      mockWriteNotifier.notify("tasks");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(mockFullSync).not.toHaveBeenCalled();
  });

  it("does not fire when offline", async () => {
    const { rerender } = renderHook(() => useSync(), { wrapper });
    await flushMicrotasks();
    mockFullSync.mockClear();
    mockIsOnline = false;
    rerender();

    act(() => {
      mockWriteNotifier.notify("tasks");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(mockFullSync).not.toHaveBeenCalled();
  });

  it("cancels the pending sync if it goes offline mid-debounce", async () => {
    const { rerender } = renderHook(() => useSync(), { wrapper });
    await flushMicrotasks();
    mockFullSync.mockClear();

    act(() => {
      mockWriteNotifier.notify("tasks");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // Going offline mid-debounce must cancel the pending timer outright — not
    // just suppress its effect — otherwise a stale timer could still fire
    // (or interact oddly with the separate reconnect trigger) once back online.
    mockIsOnline = false;
    rerender();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(mockFullSync).not.toHaveBeenCalled();
  });
});
