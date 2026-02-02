import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTargetResults } from "../useTargetResults";
import { useTargetStore } from "../../modules/target/targetStore";
import { useLogStore } from "../../modules/log/logStore";
import type { Target } from "../../modules/target/targetStore";
import type { Log } from "src/lib/tracker/types";

// Mock the stores
vi.mock("../../modules/target/targetStore");
vi.mock("../../modules/log/logStore");

const mockGetTargetsFromDB = vi.fn();
const mockGetLogsFromDB = vi.fn();

const mockTarget: Target = {
  id: "target:test",
  name: "Test Target",
  trackerId: "tracker:test",
  type: "static",
  calculation: "sum",
  direction: "increase",
  value: 100,
  period: "monthly",
  scope: [],
  createdAt: Date.now(),
};

const mockLogs: Log[] = [
  {
    id: "log:1",
    trackerId: "tracker:test",
    timestamp: Date.now() - 86400000, // 1 day ago
    value: 50,
    createdAt: Date.now() - 86400000,
  },
  {
    id: "log:2",
    trackerId: "tracker:test",
    timestamp: Date.now(),
    value: 30,
    createdAt: Date.now(),
  },
];

describe("useTargetResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useTargetStore as any).mockReturnValue({
      getTargetsFromDB: mockGetTargetsFromDB,
    });

    (useLogStore as any).mockReturnValue({
      getLogsFromDB: mockGetLogsFromDB,
    });
  });

  describe("getTargetResults", () => {
    it("should calculate target results correctly", async () => {
      mockGetTargetsFromDB.mockResolvedValue([mockTarget]);
      mockGetLogsFromDB.mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useTargetResults());
      const mockDb = {};

      const results = await result.current.getTargetResults({}, mockDb);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        targetId: "target:test",
        targetName: "Test Target",
        currentValue: 80, // 50 + 30 (sum calculation)
        targetValue: 100,
        result: "on-track", // 80 < 100 for increase direction
        percentage: 80, // (80/100) * 100
        logsUsed: 2,
        calculation: "sum",
        direction: "increase",
      });
    });

    it("should handle range targets correctly", async () => {
      const rangeTarget: Target = {
        ...mockTarget,
        type: "range",
        value: 50,
        valueMax: 150,
      };

      mockGetTargetsFromDB.mockResolvedValue([rangeTarget]);
      mockGetLogsFromDB.mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useTargetResults());
      const mockDb = {};

      const results = await result.current.getTargetResults({}, mockDb);

      expect(results[0]).toMatchObject({
        currentValue: 80,
        targetValue: 50,
        targetMax: 150,
        result: "succeed", // 80 is between 50 and 150
        percentage: 30, // ((80-50)/(150-50)) * 100
      });
    });

    it("should handle different calculations correctly", async () => {
      const testCases = [
        { calculation: "count", expected: 2 },
        { calculation: "last", expected: 30 },
        { calculation: "avg", expected: 40 },
        { calculation: "min", expected: 30 },
        { calculation: "max", expected: 50 },
      ];

      for (const testCase of testCases) {
        const testTarget = {
          ...mockTarget,
          calculation: testCase.calculation as any,
        };
        mockGetTargetsFromDB.mockResolvedValue([testTarget]);
        mockGetLogsFromDB.mockResolvedValue(mockLogs);

        const { result } = renderHook(() => useTargetResults());
        const mockDb = {};

        const results = await result.current.getTargetResults({}, mockDb);

        expect(results[0].currentValue).toBe(testCase.expected);
      }
    });

    it("should filter by trackerId", async () => {
      mockGetTargetsFromDB.mockResolvedValue([mockTarget]);
      mockGetLogsFromDB.mockResolvedValue([]);

      const { result } = renderHook(() => useTargetResults());
      const mockDb = {};

      await result.current.getTargetResults(
        { trackerId: "tracker:test" },
        mockDb,
      );

      expect(mockGetTargetsFromDB).toHaveBeenCalledWith(
        { trackerId: "tracker:test", limit: undefined },
        mockDb,
      );
    });

    it("should filter by targetIds", async () => {
      mockGetTargetsFromDB.mockResolvedValue([mockTarget]);
      mockGetLogsFromDB.mockResolvedValue([]);

      const { result } = renderHook(() => useTargetResults());
      const mockDb = {};

      await result.current.getTargetResults(
        { targetIds: ["target:test"] },
        mockDb,
      );

      expect(mockGetTargetsFromDB).toHaveBeenCalledWith(
        { trackerId: undefined, limit: 1 },
        mockDb,
      );
    });

    it("should handle date range filtering", async () => {
      mockGetTargetsFromDB.mockResolvedValue([mockTarget]);
      mockGetLogsFromDB.mockResolvedValue([]);

      const { result } = renderHook(() => useTargetResults());
      const mockDb = {};
      const from = Date.now() - 86400000 * 7; // 7 days ago
      const to = Date.now();

      await result.current.getTargetResults({ from, to }, mockDb);

      expect(mockGetLogsFromDB).toHaveBeenCalledWith(
        expect.objectContaining({
          trackerId: "tracker:test",
          from: expect.any(Number),
          to: to,
        }),
        mockDb,
      );
    });

    it("should handle empty logs", async () => {
      mockGetTargetsFromDB.mockResolvedValue([mockTarget]);
      mockGetLogsFromDB.mockResolvedValue([]);

      const { result } = renderHook(() => useTargetResults());
      const mockDb = {};

      const results = await result.current.getTargetResults({}, mockDb);

      expect(results[0]).toMatchObject({
        currentValue: 0,
        result: "on-track",
        percentage: 0,
        logsUsed: 0,
      });
    });
  });

  describe("getTargetResult", () => {
    it("should return single target result", async () => {
      mockGetTargetsFromDB.mockResolvedValue([mockTarget]);
      mockGetLogsFromDB.mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useTargetResults());
      const mockDb = {};

      const singleResult = await result.current.getTargetResult(
        "target:test",
        {},
        mockDb,
      );

      expect(singleResult).toMatchObject({
        targetId: "target:test",
        currentValue: 80,
      });
    });

    it("should return null for non-existent target", async () => {
      mockGetTargetsFromDB.mockResolvedValue([]);

      const { result } = renderHook(() => useTargetResults());
      const mockDb = {};

      const singleResult = await result.current.getTargetResult(
        "target:nonexistent",
        {},
        mockDb,
      );

      expect(singleResult).toBeNull();
    });
  });

  describe("getResultsByTracker", () => {
    it("should get results for specific tracker", async () => {
      mockGetTargetsFromDB.mockResolvedValue([mockTarget]);
      mockGetLogsFromDB.mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useTargetResults());
      const mockDb = {};

      const trackerResults = await result.current.getResultsByTracker(
        "tracker:test",
        {},
        mockDb,
      );

      expect(mockGetTargetsFromDB).toHaveBeenCalledWith(
        { trackerId: "tracker:test", limit: undefined },
        mockDb,
      );
      expect(trackerResults).toHaveLength(1);
    });
  });

  describe("result calculations", () => {
    it("should calculate decrease direction correctly", async () => {
      const decreaseTarget: Target = {
        ...mockTarget,
        direction: "decrease",
        value: 50,
      };

      mockGetTargetsFromDB.mockResolvedValue([decreaseTarget]);
      mockGetLogsFromDB.mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useTargetResults());
      const mockDb = {};

      const results = await result.current.getTargetResults({}, mockDb);

      expect(results[0]).toMatchObject({
        currentValue: 80,
        targetValue: 50,
        result: "exceed", // 80 > 50 for decrease direction
        percentage: 100, // percentage is capped at 100
      });
    });

    it("should calculate neutral direction correctly", async () => {
      const neutralTarget: Target = {
        ...mockTarget,
        direction: "neutral",
        value: 80,
      };

      mockGetTargetsFromDB.mockResolvedValue([neutralTarget]);
      mockGetLogsFromDB.mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useTargetResults());
      const mockDb = {};

      const results = await result.current.getTargetResults({}, mockDb);

      expect(results[0]).toMatchObject({
        currentValue: 80,
        targetValue: 80,
        result: "succeed", // exact match for neutral direction
      });
    });
  });

  describe("error handling", () => {
    it("should throw error when db is not provided", async () => {
      const { result } = renderHook(() => useTargetResults());

      await expect(
        result.current.getTargetResults({}, undefined as any),
      ).rejects.toThrow("Database instance is required");
    });

    it("should propagate database errors", async () => {
      mockGetTargetsFromDB.mockRejectedValue(new Error("Database error"));

      const { result } = renderHook(() => useTargetResults());
      const mockDb = {};

      await expect(result.current.getTargetResults({}, mockDb)).rejects.toThrow(
        "Failed to get target results: Database error",
      );
    });
  });
});
