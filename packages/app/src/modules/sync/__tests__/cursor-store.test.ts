// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createTestSqliteClient } from "@/modules/sqlite/__tests__/test-sqlite-client";
import { getCursor, getLastSuccessAt, setCursor, setLastSuccessAt } from "../cursor-store";

describe("cursor-store", () => {
  it("defaults every entity's cursor to 0 when unset", async () => {
    const client = await createTestSqliteClient();
    expect(await getCursor(client, "tasks")).toBe(0);
    expect(await getCursor(client, "recurring_tasks")).toBe(0);
    expect(await getCursor(client, "settings")).toBe(0);
  });

  it("persists a cursor per entity type independently", async () => {
    const client = await createTestSqliteClient();
    await setCursor(client, "tasks", 42);
    await setCursor(client, "recurring_tasks", 7);

    expect(await getCursor(client, "tasks")).toBe(42);
    expect(await getCursor(client, "recurring_tasks")).toBe(7);
    expect(await getCursor(client, "settings")).toBe(0);
  });

  it("overwrites a previously-set cursor", async () => {
    const client = await createTestSqliteClient();
    await setCursor(client, "tasks", 42);
    await setCursor(client, "tasks", 100);

    expect(await getCursor(client, "tasks")).toBe(100);
  });

  it("defaults lastSuccessAt to null and persists it once set", async () => {
    const client = await createTestSqliteClient();
    expect(await getLastSuccessAt(client)).toBeNull();

    await setLastSuccessAt(client, 1700000000000);
    expect(await getLastSuccessAt(client)).toEqual(new Date(1700000000000));
  });
});
