import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { SyncProvider, useSync } from "../context";

const mockFullSync = vi.fn();
let mockIsAuthenticated = false;

vi.mock("@/modules/sqlite/context", () => ({
  useSqliteClient: () => ({ client: {} }),
}));
vi.mock("@/modules/network/context", () => ({
  useNetworkContext: () => ({ isOnline: true }),
}));
vi.mock("@/modules/auth", () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
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

/** Signs in and waits for the resulting initial sync to complete. */
async function signIn(rerender: () => void) {
  mockIsAuthenticated = true;
  rerender();
  await flushMicrotasks();
}

describe("SyncProvider poll trigger", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFullSync.mockReset().mockResolvedValue(false);
    mockIsAuthenticated = false;
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
});
