import { describe, it, expect } from "vitest";
import { Task } from "../types";

describe("Task.isOverdue", () => {
  it("should return false for completed tasks", () => {
    const pastTime = Date.now() - 1000000; // 1 second ago
    const task = new Task({
      id: "test1",
      name: "Completed Task",
      status: 1, // completed
      atEpochMillis: pastTime,
    });

    expect(task.isOverdue()).toBe(false);
  });

  it("should return false for tasks with completedAt timestamp", () => {
    const pastTime = Date.now() - 1000000; // 1 second ago
    const task = new Task({
      id: "test2",
      name: "Task with completedAt",
      status: 0, // not completed by status
      completedAt: Date.now() - 500000, // completed 0.5 seconds ago
      atEpochMillis: pastTime,
    });

    expect(task.isOverdue()).toBe(false);
  });

  it("should return false for tasks without scheduled time", () => {
    const task = new Task({
      id: "test3",
      name: "Unscheduled Task",
      status: 0, // pending
    });

    expect(task.isOverdue()).toBe(false);
  });

  it("should return true for pending tasks past their scheduled time", () => {
    const pastTime = Date.now() - 1000000; // 1 second ago
    const task = new Task({
      id: "test4",
      name: "Overdue Task",
      status: 0, // pending
      atEpochMillis: pastTime,
      atTimeIsNone: 0, // specific time is set
    });

    expect(task.isOverdue()).toBe(true);
  });

  it("should return false for pending tasks scheduled in the future", () => {
    const futureTime = Date.now() + 1000000; // 1 second from now
    const task = new Task({
      id: "test5",
      name: "Future Task",
      status: 0, // pending
      atEpochMillis: futureTime,
    });

    expect(task.isOverdue()).toBe(false);
  });

  it("should return false for pending tasks scheduled exactly at current time", () => {
    const currentTime = Date.now();
    const task = new Task({
      id: "test6",
      name: "Current Time Task",
      status: 0, // pending
      atEpochMillis: currentTime,
    });

    expect(task.isOverdue()).toBe(false);
  });

  it("should handle tasks with atTimeIsNone flag correctly", () => {
    const pastDate = Date.now() - 1000000; // 1 second ago
    const taskWithoutTime = new Task({
      id: "test7",
      name: "Task Without Specific Time",
      status: 0, // pending
      atEpochMillis: pastDate,
      atTimeIsNone: 1, // indicates no specific time is set
    });

    expect(taskWithoutTime.isOverdue()).toBe(true);
  });

  it("should handle tasks with atTimeIsNone=0 (specific time set) correctly", () => {
    const pastTime = Date.now() - 1000000; // 1 second ago
    const taskWithSpecificTime = new Task({
      id: "test8",
      name: "Task With Specific Time",
      status: 0, // pending
      atEpochMillis: pastTime,
      atTimeIsNone: 0, // indicates specific time is set
    });

    // Tasks with specific time should be overdue if past the scheduled time
    expect(taskWithSpecificTime.isOverdue()).toBe(true);
  });

  it("should handle tasks with atTimeIsNone=1 but future date correctly", () => {
    const futureDate = Date.now() + 1000000; // 1 second from now
    const taskWithoutTimeFuture = new Task({
      id: "test9",
      name: "Future Task Without Specific Time",
      status: 0, // pending
      atEpochMillis: futureDate,
      atTimeIsNone: 1, // indicates no specific time is set
    });

    // Future tasks should not be overdue regardless of atTimeIsNone
    expect(taskWithoutTimeFuture.isOverdue()).toBe(false);
  });

  it("should handle tasks with atTimeIsNone=1 in past but not considered overdue", () => {
    // Create a task from yesterday (well past end of day)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0); // Start of yesterday

    const taskWithoutTimeNotOverdue = new Task({
      id: "test10",
      name: "Past Task Without Specific Time - Not Overdue",
      status: 0, // pending
      atEpochMillis: yesterday.valueOf(),
      atTimeIsNone: 1, // indicates no specific time is set
    });

    // Tasks without specific time should check against end of day
    // Since yesterday is well past end of its day, it should be considered overdue
    expect(taskWithoutTimeNotOverdue.isOverdue()).toBe(true);
  });
});
