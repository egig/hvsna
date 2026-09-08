import { describe, it, expect, beforeEach } from "vitest";
import { Task } from "@/domain/task";
import {
  CompletionGraceTracker,
  type GraceTimers,
} from "../completion-grace-tracker";

/** Deterministic stand-in for setTimeout — advance time by hand. */
class FakeClock implements GraceTimers {
  private seq = 0;
  private pending = new Map<number, { fn: () => void; at: number }>();
  private nowMs = 0;

  set = (fn: () => void, ms: number): unknown => {
    const id = ++this.seq;
    this.pending.set(id, { fn, at: this.nowMs + ms });
    return id;
  };

  clear = (handle: unknown): void => {
    this.pending.delete(handle as number);
  };

  advance(ms: number): void {
    const target = this.nowMs + ms;
    // Fire timers in order, moving the clock to each one's scheduled time so a
    // callback that schedules a follow-up timer gets a correct relative delay.
    for (;;) {
      const next = [...this.pending.entries()]
        .filter(([, v]) => v.at <= target)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      this.pending.delete(next[0]);
      this.nowMs = next[1].at;
      next[1].fn();
    }
    this.nowMs = target;
  }

  get size() {
    return this.pending.size;
  }
}

const HOLD = 450;
const LEAVE = 240;

function task(id: string | number, extra: Partial<Task> = {}): Task {
  return new Task({ id, name: `task-${id}`, status: 0, atEpochMillis: 1000, ...extra });
}

describe("CompletionGraceTracker", () => {
  let clock: FakeClock;
  let tracker: CompletionGraceTracker;

  beforeEach(() => {
    clock = new FakeClock();
    tracker = new CompletionGraceTracker(HOLD, LEAVE, clock);
  });

  it("retains a held task in a pending list, rendered as done", () => {
    tracker.hold(task("a"));

    const retained = tracker.retain([]);
    expect(retained.map((t) => t.id)).toEqual(["a"]);
    expect(retained[0].status).toBe(1);
    expect(retained[0].completedAt).toBeTypeOf("number");
    expect(tracker.phase("a")).toBe("held");
  });

  it("does not duplicate a task already present in the list", () => {
    tracker.hold(task("a"));
    const retained = tracker.retain([task("a", { status: 1 })]);
    expect(retained).toHaveLength(1);
  });

  it("moves held -> leaving -> gone across the grace + leave windows", () => {
    tracker.hold(task("a"));
    expect(tracker.phase("a")).toBe("held");

    clock.advance(HOLD);
    expect(tracker.phase("a")).toBe("leaving");
    expect(tracker.retain([]).map((t) => t.id)).toEqual(["a"]);

    clock.advance(LEAVE);
    expect(tracker.phase("a")).toBeNull();
    expect(tracker.retain([])).toEqual([]);
  });

  it("suppress hides still-held rows from a completed list", () => {
    tracker.hold(task("a"));
    expect(tracker.suppress([task("a", { status: 1 }), task("b", { status: 1 })])
      .map((t) => t.id)).toEqual(["b"]);

    clock.advance(HOLD + LEAVE);
    expect(tracker.suppress([task("a", { status: 1 })]).map((t) => t.id)).toEqual([
      "a",
    ]);
  });

  it("release drops the row immediately and cancels timers (undo / re-check)", () => {
    tracker.hold(task("a"));
    tracker.release("a");

    expect(tracker.phase("a")).toBeNull();
    expect(tracker.retain([])).toEqual([]);
    expect(clock.size).toBe(0);

    // No late fire resurrects it.
    clock.advance(HOLD + LEAVE);
    expect(tracker.retain([])).toEqual([]);
  });

  it("re-holding the same id restarts the grace and clears the old timers", () => {
    tracker.hold(task("a"));
    clock.advance(HOLD);
    expect(tracker.phase("a")).toBe("leaving");

    tracker.hold(task("a"));
    expect(tracker.phase("a")).toBe("held");

    clock.advance(LEAVE);
    // Old leave timer must not fire.
    expect(tracker.phase("a")).toBe("held");
    clock.advance(HOLD + LEAVE);
    expect(tracker.phase("a")).toBeNull();
  });

  it("notifies subscribers on every state change", () => {
    let hits = 0;
    const unsub = tracker.subscribe(() => {
      hits++;
    });

    tracker.hold(task("a")); // hold
    clock.advance(HOLD); // -> leaving
    clock.advance(LEAVE); // -> gone
    expect(hits).toBe(3);

    unsub();
    tracker.hold(task("b"));
    expect(hits).toBe(3);
  });

  it("keeps the snapshot reference stable when nothing changes", () => {
    const first = tracker.getSnapshot();
    expect(tracker.getSnapshot()).toBe(first);

    tracker.hold(task("a"));
    expect(tracker.getSnapshot()).not.toBe(first);
  });

  it("ignores tasks with no id", () => {
    tracker.hold(new Task({ name: "no id", status: 0 }));
    expect(tracker.retain([])).toEqual([]);
  });
});
