import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import type { Task } from "@/domain/task";
import {
  CompletionGraceTracker,
  type GracePhase,
  type GraceSnapshotEntry,
} from "./completion-grace-tracker";

const CompletionGraceContext = createContext<CompletionGraceTracker | null>(
  null
);

export function CompletionGraceProvider({
  children,
  tracker,
}: {
  children: React.ReactNode;
  /** Injectable for tests; a real tracker is created otherwise. */
  tracker?: CompletionGraceTracker;
}) {
  const ref = useRef<CompletionGraceTracker | undefined>(undefined);
  if (!ref.current) ref.current = tracker ?? new CompletionGraceTracker();
  return (
    <CompletionGraceContext.Provider value={ref.current}>
      {children}
    </CompletionGraceContext.Provider>
  );
}

const EMPTY_SNAPSHOT: Map<string, GraceSnapshotEntry> = new Map();
const NOOP_SUBSCRIBE = () => () => {};
const getEmptySnapshot = () => EMPTY_SNAPSHOT;

export interface CompletionGrace {
  snapshot: Map<string, GraceSnapshotEntry>;
  /** Persist-now, defer-the-visual: call right before completing a task. */
  hold: (task: Task) => void;
  /** Undo / re-check: drop the held row immediately. */
  release: (id: string | number) => void;
  /** Merge held rows back into a pending list. */
  retain: (tasks: Task[]) => Task[];
  /** Drop still-held rows from a completed list. */
  suppress: (tasks: Task[]) => Task[];
  phase: (id: string | number) => GracePhase | null;
}

/**
 * Subscribes the caller to completion-grace state. Degrades to a no-op when
 * no provider is mounted so hooks stay usable in isolation (tests).
 */
export function useCompletionGrace(): CompletionGrace {
  const tracker = useContext(CompletionGraceContext);
  const snapshot = useSyncExternalStore(
    tracker ? tracker.subscribe : NOOP_SUBSCRIBE,
    tracker ? tracker.getSnapshot : getEmptySnapshot
  );

  return useMemo<CompletionGrace>(
    () => ({
      snapshot,
      hold: (task) => tracker?.hold(task),
      release: (id) => tracker?.release(id),
      retain: (tasks) => (tracker ? tracker.retain(tasks) : tasks),
      suppress: (tasks) => (tracker ? tracker.suppress(tasks) : tasks),
      phase: (id) => tracker?.phase(id) ?? null,
    }),
    [tracker, snapshot]
  );
}
