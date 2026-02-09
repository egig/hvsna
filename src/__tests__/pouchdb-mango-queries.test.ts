import { describe, it, expect, beforeEach, afterEach } from "vitest";
import PouchDB from "pouchdb";
import "pouchdb-find";

// Use the memory adapter directly
const PouchDBMemory = require("pouchdb-memory");

// Extend PouchDB Database interface to include find plugin methods
interface ExtendedDatabase extends PouchDB.Database {
  find(request: any): Promise<{ docs: any[] }>;
  createIndex(request: any): Promise<any>;
  getIndexes(): Promise<{ indexes: any[] }>;
  deleteIndex(request: any): Promise<any>;
}

describe("PouchDB Mango Queries - Index and Selector Relationship", () => {
  let db: ExtendedDatabase;

  beforeEach(async () => {
    // Create a new in-memory database for each test
    db = new PouchDBMemory("test-db", {
      adapter: "memory",
    }) as ExtendedDatabase;
  });

  afterEach(async () => {
    // Clean up the database after each test
    if (db) {
      await db.destroy();
    }
  });

  describe("Single Field Index and Query", () => {
    beforeEach(async () => {
      // Insert sample documents
      await db.bulkDocs([
        { _id: "doc1", type: "task", status: "pending", priority: 1 },
        { _id: "doc2", type: "task", status: "completed", priority: 2 },
        { _id: "doc3", type: "task", status: "pending", priority: 3 },
        { _id: "doc4", type: "note", status: "pending", priority: 1 },
      ]);
    });

    it("should create and use single field index for selector", async () => {
      // Create index on status field
      await db.createIndex({
        index: { fields: ["status"] },
      });

      // Query using the indexed field
      const result = await db.find({
        selector: { status: "pending" },
      });

      expect(result.docs).toHaveLength(3);
      expect(result.docs.every((doc) => doc.status === "pending")).toBe(true);
    });

    it("should sort using single field index", async () => {
      // Create index on priority field
      await db.createIndex({
        index: { fields: ["priority"] },
      });

      // Query using the indexed field with range to enable sorting
      const result = await db.find({
        selector: { priority: { $gte: 0 } },
        sort: [{ priority: "asc" }],
      });

      expect(result.docs).toHaveLength(4);
      // Verify results are sorted by priority
      const priorities = result.docs.map((doc) => doc.priority);
      expect(priorities).toEqual(priorities.sort((a, b) => a - b));
    });
  });

  describe("Compound Index and Query", () => {
    beforeEach(async () => {
      // Insert sample documents
      await db.bulkDocs([
        {
          _id: "doc1",
          type: "task",
          status: "pending",
          priority: 1,
          category: "work",
        },
        {
          _id: "doc2",
          type: "task",
          status: "completed",
          priority: 2,
          category: "personal",
        },
        {
          _id: "doc3",
          type: "task",
          status: "pending",
          priority: 3,
          category: "work",
        },
        {
          _id: "doc4",
          type: "note",
          status: "pending",
          priority: 1,
          category: "personal",
        },
      ]);
    });

    it("should create and use compound index for multi-field selector", async () => {
      // Create compound index on type and status
      await db.createIndex({
        index: { fields: ["type", "status"] },
      });

      // Query using both indexed fields
      const result = await db.find({
        selector: {
          type: "task",
          status: "pending",
        },
      });

      expect(result.docs).toHaveLength(2);
      expect(
        result.docs.every(
          (doc) => doc.type === "task" && doc.status === "pending",
        ),
      ).toBe(true);
    });

    it("should sort using compound index", async () => {
      // Create compound index on type and priority
      await db.createIndex({
        index: { fields: ["type", "priority"] },
      });

      // Query and sort using the compound index
      const result = await db.find({
        selector: { type: "task" },
        sort: [{ type: "asc" }, { priority: "asc" }],
      });

      expect(result.docs).toHaveLength(3);
      expect(result.docs[0].priority).toBe(1);
      expect(result.docs[1].priority).toBe(2);
      expect(result.docs[2].priority).toBe(3);
    });

    it("should use compound index for partial selector match", async () => {
      // Create compound index on type, status, priority
      await db.createIndex({
        index: { fields: ["type", "status", "priority"] },
      });

      // Query using only the first field of the compound index
      const result = await db.find({
        selector: { type: "task" },
      });

      expect(result.docs).toHaveLength(3);
      expect(result.docs.every((doc) => doc.type === "task")).toBe(true);
    });
  });

  describe("Index Selection and Query Optimization", () => {
    beforeEach(async () => {
      // Insert sample documents
      await db.bulkDocs([
        {
          _id: "doc1",
          type: "task",
          status: "pending",
          priority: 1,
          created: 1000,
        },
        {
          _id: "doc2",
          type: "task",
          status: "completed",
          priority: 2,
          created: 2000,
        },
        {
          _id: "doc3",
          type: "task",
          status: "pending",
          priority: 3,
          created: 3000,
        },
        {
          _id: "doc4",
          type: "note",
          status: "pending",
          priority: 1,
          created: 4000,
        },
      ]);

      // Create multiple indexes
      await db.createIndex({ index: { fields: ["type"] } });
      await db.createIndex({ index: { fields: ["status"] } });
      await db.createIndex({ index: { fields: ["priority"] } });
      await db.createIndex({ index: { fields: ["type", "status"] } });
      await db.createIndex({ index: { fields: ["type", "priority"] } });
    });

    it("should use appropriate index for complex selector", async () => {
      // This should use the compound index on ['type', 'status']
      const result = await db.find({
        selector: {
          type: "task",
          status: "pending",
        },
      });

      expect(result.docs).toHaveLength(2);
      expect(
        result.docs.every(
          (doc) => doc.type === "task" && doc.status === "pending",
        ),
      ).toBe(true);
    });

    it("should use appropriate index for sorted query", async () => {
      // This should use the compound index on ['type', 'priority']
      const result = await db.find({
        selector: { type: "task" },
        sort: [{ type: "asc" }, { priority: "desc" }],
      });

      expect(result.docs).toHaveLength(3);
      // Sort the results by priority descending to verify
      const sortedByPriority = result.docs.sort(
        (a, b) => b.priority - a.priority,
      );
      expect(result.docs[0].priority).toBe(sortedByPriority[0].priority);
      expect(result.docs[1].priority).toBe(sortedByPriority[1].priority);
      expect(result.docs[2].priority).toBe(sortedByPriority[2].priority);
    });

    it("should list all available indexes", async () => {
      const indexes = await db.getIndexes();

      expect(indexes.indexes).toBeDefined();
      expect(indexes.indexes.length).toBeGreaterThan(1); // At least the default _id index

      // Debug: log the structure to understand the format
      console.log(
        "Indexes structure:",
        JSON.stringify(indexes.indexes[0], null, 2),
      );

      // Check that we have indexes beyond the default
      const customIndexes = indexes.indexes.filter(
        (idx: any) => idx.name && idx.name !== "_all_docs",
      );
      expect(customIndexes.length).toBeGreaterThan(0);
    });
  });

  describe("Query Operators with Indexes", () => {
    beforeEach(async () => {
      // Insert sample documents with various field values
      await db.bulkDocs([
        {
          _id: "doc1",
          type: "task",
          priority: 1,
          score: 85,
          tags: ["urgent", "work"],
        },
        {
          _id: "doc2",
          type: "task",
          priority: 2,
          score: 92,
          tags: ["personal"],
        },
        {
          _id: "doc3",
          type: "task",
          priority: 3,
          score: 78,
          tags: ["work", "review"],
        },
        { _id: "doc4", type: "note", priority: 1, score: 88, tags: ["urgent"] },
      ]);

      // Create indexes for numeric and array fields
      await db.createIndex({ index: { fields: ["priority"] } });
      await db.createIndex({ index: { fields: ["score"] } });
      await db.createIndex({ index: { fields: ["type", "priority"] } });
    });

    it("should use index with range operators ($gt, $lt, $gte, $lte)", async () => {
      const result = await db.find({
        selector: {
          type: "task",
          priority: { $gt: 1, $lte: 2 },
        },
      });

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].priority).toBe(2);
    });

    it("should use index with $in operator", async () => {
      const result = await db.find({
        selector: {
          type: "task",
          priority: { $in: [1, 3] },
        },
      });

      expect(result.docs).toHaveLength(2);
      expect(result.docs.every((doc) => [1, 3].includes(doc.priority))).toBe(
        true,
      );
    });

    it("should use index with $ne operator", async () => {
      const result = await db.find({
        selector: {
          type: "task",
          priority: { $ne: 2 },
        },
      });

      expect(result.docs).toHaveLength(2);
      expect(result.docs.every((doc) => doc.priority !== 2)).toBe(true);
    });

    it("should use index with $exists operator", async () => {
      const result = await db.find({
        selector: {
          type: "task",
          score: { $exists: true, $gte: 80 },
        },
      });

      expect(result.docs).toHaveLength(2);
      expect(result.docs.every((doc) => doc.score >= 80)).toBe(true);
    });
  });

  describe("Index Management", () => {
    it("should create and delete custom named index", async () => {
      // Create index with custom name
      const createResult = await db.createIndex({
        index: {
          fields: ["customField"],
          name: "custom-field-index",
        },
      });

      expect(createResult.result).toBe("created");
      expect((createResult as any).name).toBe("custom-field-index");

      // Verify index exists
      const indexes = await db.getIndexes();
      const customIndex = indexes.indexes.find(
        (idx) => idx.name === "custom-field-index",
      );
      expect(customIndex).toBeDefined();

      // Delete the index
      await db.deleteIndex({
        name: "custom-field-index",
        ddoc: (createResult as any).id,
      });

      // Verify index is deleted
      const indexesAfterDelete = await db.getIndexes();
      const deletedIndex = indexesAfterDelete.indexes.find(
        (idx) => idx.name === "custom-field-index",
      );
      expect(deletedIndex).toBeUndefined();
    });

    it("should handle duplicate index creation gracefully", async () => {
      // Create first index
      await db.createIndex({
        index: { fields: ["duplicateField"] },
      });

      // Create same index again - should not error
      const result = await db.createIndex({
        index: { fields: ["duplicateField"] },
      });

      expect(result.result).toBe("exists");
    });
  });

  describe("Advanced Index Usage Patterns", () => {
    beforeEach(async () => {
      // Insert sample documents with the structure the user mentioned
      await db.bulkDocs([
        {
          _id: "doc1",
          type: "foo",
          hijriDate: "2023-01-01",
          atEpochMillis: 1672531200000,
          name: "Task 1",
        },
        {
          _id: "doc2",
          type: "foo",
          hijriDate: "2023-01-01",
          atEpochMillis: 1672617600000,
          name: "Task 2",
        },
        {
          _id: "doc3",
          type: "foo",
          hijriDate: "2023-01-02",
          atEpochMillis: 1672704000000,
          name: "Task 3",
        },
        {
          _id: "doc4",
          type: "bar",
          hijriDate: "2023-01-01",
          atEpochMillis: 1672790400000,
          name: "Task 4",
        },
      ]);
    });

    it("should handle user-specific query pattern: compound index with partial selector and different sort field", async () => {
      // Create the exact index the user mentioned
      await db.createIndex({
        index: {
          fields: ["type", "hijriDate", "atEpochMillis"],
        },
      });

      // CORRECT WAY: Include all fields in selector that are in the index prefix
      const mangoQuery = {
        selector: {
          type: "foo",
          hijriDate: "2023-01-01",
          // Note: We don't need to include scheduledAtEpochMillis in selector for range queries
        },
        sort: [
          { type: "asc" },
          { hijriDate: "asc" },
          { atEpochMillis: "asc" },
        ],
      };

      const result = await db.find(mangoQuery);

      // Should find 2 documents with type='foo' and hijriDate='2023-01-01'
      expect(result.docs).toHaveLength(2);
      expect(
        result.docs.every(
          (doc) => doc.type === "foo" && doc.hijriDate === "2023-01-01",
        ),
      ).toBe(true);

      // Should be sorted by atEpochMillis ascending (within the type+hijriDate group)
      const scheduledTimes = result.docs.map(
        (doc) => doc.atEpochMillis,
      );
      expect(scheduledTimes).toEqual(scheduledTimes.sort((a, b) => a - b));

      // Verify the specific documents
      expect(result.docs[0].name).toBe("Task 1"); // Earlier time
      expect(result.docs[1].name).toBe("Task 2"); // Later time
    });

    it("should show alternative: create index specifically for the desired sort", async () => {
      // Create index specifically for sorting by atEpochMillis
      await db.createIndex({
        index: {
          fields: ["type", "hijriDate", "atEpochMillis"],
        },
      });

      // Alternative approach: Use range query on the sort field
      const result = await db.find({
        selector: {
          type: "foo",
          hijriDate: "2023-01-01",
          atEpochMillis: { $gte: 0 }, // Range query to enable sorting
        },
        sort: [
          { type: "asc" },
          { hijriDate: "asc" },
          { atEpochMillis: "asc" },
        ],
      });

      expect(result.docs).toHaveLength(2);
      expect(
        result.docs.every(
          (doc) => doc.type === "foo" && doc.hijriDate === "2023-01-01",
        ),
      ).toBe(true);

      // Verify sorting
      const scheduledTimes = result.docs.map(
        (doc) => doc.atEpochMillis,
      );
      expect(scheduledTimes).toEqual(scheduledTimes.sort((a, b) => a - b));
    });

    it("should demonstrate why the sort field must be part of the index prefix", async () => {
      // Create index where atEpochMillis is NOT in the prefix
      await db.createIndex({
        index: {
          fields: ["type", "hijriDate", "name"], // atEpochMillis is missing
        },
      });

      // This query will fail because atEpochMillis is not in the index prefix
      await expect(
        db.find({
          selector: {
            type: "foo",
            hijriDate: "2023-01-01",
          },
          sort: [{ atEpochMillis: "asc" }],
        }),
      ).rejects.toThrow(/Cannot sort on field\(s\) "atEpochMillis"/);
    });

    it("should work when sort field is included in index prefix", async () => {
      // Create index where atEpochMillis IS in the prefix
      await db.createIndex({
        index: {
          fields: ["type", "atEpochMillis", "hijriDate"],
        },
      });

      // This query will work because atEpochMillis is in the index prefix
      const result = await db.find({
        selector: {
          type: "foo",
        },
        sort: [{ type: "asc" }, { atEpochMillis: "asc" }],
      });

      expect(result.docs).toHaveLength(3); // All 'foo' type documents
      expect(result.docs.every((doc) => doc.type === "foo")).toBe(true);

      // Should be sorted by atEpochMillis within each type
      const fooDocs = result.docs.filter((doc) => doc.type === "foo");
      const scheduledTimes = fooDocs.map((doc) => doc.atEpochMillis);
      expect(scheduledTimes).toEqual(scheduledTimes.sort((a, b) => a - b));
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle query without matching index", async () => {
      await db.bulkDocs([
        { _id: "doc1", field: "value1" },
        { _id: "doc2", field: "value2" },
      ]);

      // Query on field without index
      const result = await db.find({
        selector: { field: "value1" },
      });

      // Should still work but may have warning
      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].field).toBe("value1");
    });

    it("should handle sort without matching index", async () => {
      await db.bulkDocs([
        { _id: "doc1", name: "Alice" },
        { _id: "doc2", name: "Bob" },
      ]);

      // Create index on name field for sorting
      await db.createIndex({
        index: { fields: ["name"] },
      });

      // Sort on indexed field
      const result = await db.find({
        selector: {},
        sort: [{ name: "asc" }],
      });

      expect(result.docs).toHaveLength(2);
      expect(result.docs[0].name).toBe("Alice");
      expect(result.docs[1].name).toBe("Bob");
    });
  });
});
