import { describe, expect, it } from "vitest";
import { computeOverlapLayout, snapMinutesTo } from "../timeline-layout";

describe("snapMinutesTo", () => {
  it("rounds down to the nearest snap increment", () => {
    expect(snapMinutesTo(22, 15, 15)).toBe(15);
  });

  it("rounds up to the nearest snap increment", () => {
    expect(snapMinutesTo(38, 15, 15)).toBe(45);
  });

  it("leaves an exact multiple unchanged", () => {
    expect(snapMinutesTo(30, 15, 15)).toBe(30);
  });

  it("floors at the minimum even if snapping would round below it", () => {
    expect(snapMinutesTo(5, 15, 15)).toBe(15);
    expect(snapMinutesTo(-10, 15, 15)).toBe(15);
  });
});

describe("computeOverlapLayout", () => {
  it("gives non-overlapping blocks a single column", () => {
    const result = computeOverlapLayout([
      { id: "a", startEpoch: 0, endEpoch: 100 },
      { id: "b", startEpoch: 100, endEpoch: 200 },
    ]);
    expect(result.get("a")).toEqual({ column: 0, columnCount: 1 });
    expect(result.get("b")).toEqual({ column: 0, columnCount: 1 });
  });

  it("splits two directly-overlapping blocks into two columns", () => {
    const result = computeOverlapLayout([
      { id: "a", startEpoch: 0, endEpoch: 100 },
      { id: "b", startEpoch: 50, endEpoch: 150 },
    ]);
    expect(result.get("a")).toEqual({ column: 0, columnCount: 2 });
    expect(result.get("b")).toEqual({ column: 1, columnCount: 2 });
  });

  it("groups a transitive chain (A-B overlap, B-C overlap, A-C don't) into one cluster, reusing a freed column", () => {
    // Max simultaneous overlap in this chain is 2 (A and C never coexist),
    // so C correctly reuses A's column once A has ended — 2 columns total,
    // not 3, matching how a real calendar renders a non-clique chain.
    const result = computeOverlapLayout([
      { id: "a", startEpoch: 0, endEpoch: 100 },
      { id: "b", startEpoch: 50, endEpoch: 150 },
      { id: "c", startEpoch: 120, endEpoch: 200 },
    ]);
    expect(result.get("a")!.columnCount).toBe(2);
    expect(result.get("b")!.columnCount).toBe(2);
    expect(result.get("c")!.columnCount).toBe(2);
    expect(result.get("a")!.column).toBe(0);
    expect(result.get("b")!.column).toBe(1);
    expect(result.get("c")!.column).toBe(0);
  });

  it("gives a genuine 3-way mutual overlap 3 columns", () => {
    const result = computeOverlapLayout([
      { id: "a", startEpoch: 0, endEpoch: 200 },
      { id: "b", startEpoch: 50, endEpoch: 250 },
      { id: "c", startEpoch: 100, endEpoch: 300 },
    ]);
    expect(result.get("a")!.columnCount).toBe(3);
    expect(result.get("b")!.columnCount).toBe(3);
    expect(result.get("c")!.columnCount).toBe(3);
    const columns = new Set([
      result.get("a")!.column,
      result.get("b")!.column,
      result.get("c")!.column,
    ]);
    expect(columns).toEqual(new Set([0, 1, 2]));
  });

  it("stacks identical-start blocks into separate columns", () => {
    const result = computeOverlapLayout([
      { id: "a", startEpoch: 0, endEpoch: 100 },
      { id: "b", startEpoch: 0, endEpoch: 100 },
    ]);
    expect(result.get("a")!.columnCount).toBe(2);
    expect(result.get("b")!.columnCount).toBe(2);
    expect(result.get("a")!.column).not.toBe(result.get("b")!.column);
  });

  it("reuses a freed column when a block fully contains another that already ended", () => {
    const result = computeOverlapLayout([
      { id: "outer", startEpoch: 0, endEpoch: 300 },
      { id: "inner", startEpoch: 50, endEpoch: 100 },
      { id: "after", startEpoch: 150, endEpoch: 200 },
    ]);
    expect(result.get("outer")!.columnCount).toBe(2);
    expect(result.get("inner")!.columnCount).toBe(2);
    expect(result.get("after")!.columnCount).toBe(2);
    expect(result.get("outer")!.column).toBe(0);
    expect(result.get("inner")!.column).toBe(1);
    // "after" starts once "inner" has ended, so it reuses inner's column.
    expect(result.get("after")!.column).toBe(1);
  });

  it("returns an empty map for no blocks", () => {
    expect(computeOverlapLayout([]).size).toBe(0);
  });
});
