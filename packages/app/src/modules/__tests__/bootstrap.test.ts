import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockInitialize,
  mockIsAuthenticated,
  mockGetCurrentUser,
  mockFullSync,
  mockGetLastSuccessAt,
} = vi.hoisted(() => ({
  mockInitialize: vi.fn(),
  mockIsAuthenticated: vi.fn(),
  mockGetCurrentUser: vi.fn(),
  mockFullSync: vi.fn(),
  mockGetLastSuccessAt: vi.fn(),
}));

vi.mock("@/infra/auth/AuthServiceFactory", () => ({
  getAuthService: () => ({
    initialize: mockInitialize,
    isAuthenticated: mockIsAuthenticated,
    getCurrentUser: mockGetCurrentUser,
  }),
}));
vi.mock("@/infra/sync/SyncApiClientFactory", () => ({
  getSyncApiClient: () => ({}),
}));
vi.mock("@/modules/sync/sync-engine", () => ({
  createSyncEngine: () => ({ fullSync: mockFullSync }),
}));
vi.mock("@/modules/sync/cursor-store", () => ({
  getLastSuccessAt: mockGetLastSuccessAt,
}));
vi.mock("@/modules/logger", () => ({ default: { warn: vi.fn() } }));

import { bootstrapApp } from "../bootstrap";

const sqlite = {} as never;

describe("bootstrapApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInitialize.mockResolvedValue(undefined);
    mockIsAuthenticated.mockResolvedValue(false);
    mockGetCurrentUser.mockResolvedValue(null);
    mockFullSync.mockResolvedValue(true);
    mockGetLastSuccessAt.mockResolvedValue(null);
  });

  it("restores the session and returns no user when signed out", async () => {
    const result = await bootstrapApp(sqlite);

    expect(mockInitialize).toHaveBeenCalledOnce();
    expect(mockFullSync).not.toHaveBeenCalled();
    expect(result).toEqual({
      user: null,
      lastSyncAt: null,
      initialSyncPerformed: false,
    });
  });

  it("runs an initial sync for a signed-in, verified user", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetCurrentUser.mockResolvedValue({ emailVerified: true, syncEnabled: true });
    const syncedAt = new Date("2026-01-01T00:00:00Z");
    mockGetLastSuccessAt.mockResolvedValue(syncedAt);

    const result = await bootstrapApp(sqlite);

    expect(mockFullSync).toHaveBeenCalledOnce();
    expect(result.initialSyncPerformed).toBe(true);
    expect(result.lastSyncAt).toBe(syncedAt);
  });

  it("skips the sync for an unverified user", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetCurrentUser.mockResolvedValue({ emailVerified: false });

    const result = await bootstrapApp(sqlite);

    expect(mockFullSync).not.toHaveBeenCalled();
    expect(result.user).toEqual({ emailVerified: false });
    expect(result.initialSyncPerformed).toBe(false);
  });

  it("skips the sync for a verified user without a Sync plan", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetCurrentUser.mockResolvedValue({ emailVerified: true, syncEnabled: false });

    const result = await bootstrapApp(sqlite);

    expect(mockFullSync).not.toHaveBeenCalled();
    expect(result.initialSyncPerformed).toBe(false);
  });

  it("still resolves (initialSyncPerformed false) when the sync throws", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetCurrentUser.mockResolvedValue({ emailVerified: true, syncEnabled: true });
    mockFullSync.mockRejectedValue(new Error("network down"));

    const result = await bootstrapApp(sqlite);

    expect(result.initialSyncPerformed).toBe(false);
    expect(result.user).toEqual({ emailVerified: true, syncEnabled: true });
  });

  it("still resolves when the session restore throws", async () => {
    mockInitialize.mockRejectedValue(new Error("boom"));

    const result = await bootstrapApp(sqlite);

    expect(result).toEqual({
      user: null,
      lastSyncAt: null,
      initialSyncPerformed: false,
    });
  });
});
