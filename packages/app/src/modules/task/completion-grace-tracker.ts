import { Task } from "@/domain/task";

/**
 * "Persist now, defer the visual" for task completion — mirrors the Android
 * app's `CompletionGraceTracker`. Checking a task off writes to the DB
 * immediately; this unit only holds the row in its *pending* list a little
 * longer so it can animate (checkbox pop + strike-through sweep) before it
 * slides out and reappears in the "completed" section.
 *
 * Framework-free on purpose so it can be unit-tested without React — the
 * React glue lives in `completion-grace-context.tsx`.
 */

/** How long a checked-off row lingers in its pending list, rendered as done. */
export const COMPLETION_GRACE_MS = 450;
/** Extra window after the grace, during which the row fades/collapses out. */
export const COMPLETION_LEAVE_MS = 240;

export type GracePhase = "held" | "leaving";

export interface GraceTimers {
  set: (fn: () => void, ms: number) => unknown;
  clear: (handle: unknown) => void;
}

const realTimers: GraceTimers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

interface Entry {
  /** Snapshot taken at check-off time, already flipped to done. */
  task: Task;
  phase: GracePhase;
  holdTimer: unknown;
  leaveTimer: unknown;
}

export interface GraceSnapshotEntry {
  task: Task;
  phase: GracePhase;
}

export class CompletionGraceTracker {
  private entries = new Map<string, Entry>();
  private listeners = new Set<() => void>();
  private snapshot: Map<string, GraceSnapshotEntry> = new Map();

  constructor(
    private readonly holdMs: number = COMPLETION_GRACE_MS,
    private readonly leaveMs: number = COMPLETION_LEAVE_MS,
    private readonly timers: GraceTimers = realTimers
  ) {}

  /** Call right before the DB write when a task is checked off. */
  hold(task: Task): void {
    if (task.id == null) return;
    const id = String(task.id);
    this.clearEntry(id);

    const done = new Task({
      ...task,
      status: 1,
      completedAt: task.completedAt ?? Date.now(),
    });
    const entry: Entry = {
      task: done,
      phase: "held",
      holdTimer: null,
      leaveTimer: null,
    };
    entry.holdTimer = this.timers.set(() => {
      entry.phase = "leaving";
      entry.holdTimer = null;
      entry.leaveTimer = this.timers.set(() => {
        this.entries.delete(id);
        this.rebuild();
      }, this.leaveMs);
      this.rebuild();
    }, this.holdMs);

    this.entries.set(id, entry);
    this.rebuild();
  }

  /** Undo / re-check — drop the held row straight away. */
  release(id: string | number): void {
    const key = String(id);
    if (!this.entries.has(key)) return;
    this.clearEntry(key);
    this.rebuild();
  }

  has(id: string | number): boolean {
    return this.entries.has(String(id));
  }

  phase(id: string | number): GracePhase | null {
    return this.snapshot.get(String(id))?.phase ?? null;
  }

  /** Merge held rows into a pending list (deduped by id). */
  retain(tasks: Task[]): Task[] {
    if (this.snapshot.size === 0) return tasks;
    const present = new Set(tasks.map((t) => String(t.id)));
    const extra: Task[] = [];
    for (const [id, entry] of this.snapshot) {
      if (!present.has(id)) extra.push(entry.task);
    }
    return extra.length === 0 ? tasks : [...tasks, ...extra];
  }

  /** Drop still-held rows from a completed list so they don't render twice. */
  suppress(tasks: Task[]): Task[] {
    if (this.snapshot.size === 0) return tasks;
    return tasks.filter((t) => !this.snapshot.has(String(t.id)));
  }

  // --- React useSyncExternalStore glue -------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): Map<string, GraceSnapshotEntry> => this.snapshot;

  // -----------------------------------------------------------------------

  private clearEntry(id: string): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    if (entry.holdTimer != null) this.timers.clear(entry.holdTimer);
    if (entry.leaveTimer != null) this.timers.clear(entry.leaveTimer);
    this.entries.delete(id);
  }

  private rebuild(): void {
    const next = new Map<string, GraceSnapshotEntry>();
    for (const [id, entry] of this.entries) {
      next.set(id, { task: entry.task, phase: entry.phase });
    }
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }
}
