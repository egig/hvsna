export interface TimelineBlockInput {
  id: string;
  startEpoch: number;
  endEpoch: number;
}

export interface TimelineBlockPlacement {
  column: number;
  columnCount: number;
}

/**
 * Lays out overlapping time blocks into side-by-side columns, like a
 * calendar day view. Two phases:
 *  1. Cluster detection (sweep by start time) — groups transitively
 *     connected blocks (A overlaps B, B overlaps C, A and C don't touch)
 *     into one cluster, since they must all share the same column set.
 *  2. Greedy column assignment within each cluster — each block takes the
 *     lowest-indexed column that's free again by its start time, opening a
 *     new column otherwise. Every block in a cluster gets the cluster's
 *     final column count (not a per-block max), so mutually-linked blocks
 *     render as equal-width columns.
 */
export function computeOverlapLayout(
  blocks: TimelineBlockInput[]
): Map<string, TimelineBlockPlacement> {
  const result = new Map<string, TimelineBlockPlacement>();
  if (blocks.length === 0) return result;

  const sorted = [...blocks].sort((a, b) => a.startEpoch - b.startEpoch);

  let cluster: TimelineBlockInput[] = [];
  let clusterEndEpoch = -Infinity;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const columnEndEpoch: number[] = [];
    const placements: { id: string; column: number }[] = [];
    for (const block of cluster) {
      let column = columnEndEpoch.findIndex((end) => end <= block.startEpoch);
      if (column === -1) {
        column = columnEndEpoch.length;
        columnEndEpoch.push(block.endEpoch);
      } else {
        columnEndEpoch[column] = block.endEpoch;
      }
      placements.push({ id: block.id, column });
    }
    const columnCount = columnEndEpoch.length;
    for (const placement of placements) {
      result.set(placement.id, { column: placement.column, columnCount });
    }
    cluster = [];
  };

  for (const block of sorted) {
    if (block.startEpoch >= clusterEndEpoch) {
      flushCluster();
      clusterEndEpoch = block.endEpoch;
    } else {
      clusterEndEpoch = Math.max(clusterEndEpoch, block.endEpoch);
    }
    cluster.push(block);
  }
  flushCluster();

  return result;
}

export function epochToTopPx(
  epoch: number,
  gridStartEpoch: number,
  pxPerMinute: number
): number {
  return ((epoch - gridStartEpoch) / 60_000) * pxPerMinute;
}

export function minutesToHeightPx(
  durationMinutes: number,
  pxPerMinute: number,
  minHeightPx: number
): number {
  return Math.max(durationMinutes * pxPerMinute, minHeightPx);
}

/** Drag/resize granularity, in minutes — matches the default task duration. */
export const SNAP_MINUTES = 15;
/** Shortest duration a resize can produce. */
export const MIN_DURATION_MINUTES = 15;
/** Rendering floor for a block's height, regardless of how short its duration is. */
export const MIN_BLOCK_HEIGHT_PX = 22;

/** Rounds `minutes` to the nearest `snap` and floors at `min`. */
export function snapMinutesTo(minutes: number, snap: number, min: number): number {
  const snapped = Math.round(minutes / snap) * snap;
  return Math.max(snapped, min);
}
