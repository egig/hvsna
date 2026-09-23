type SortValue = number | null;

/** Ascending, with nulls first — SQL's `ORDER BY x ASC` in SQLite, which the
 * repositories' orderings were originally written against. */
export function ascNullsFirst(a: SortValue, b: SortValue): number {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  return a - b;
}

/** Descending, with nulls last (`ORDER BY x DESC` in SQLite). */
export function descNullsLast(a: SortValue, b: SortValue): number {
  return ascNullsFirst(b, a);
}

/**
 * Sorts by each comparator in turn, then by `created_at` so ties keep
 * insertion order rather than the random order of UUID primary keys.
 */
export function sortRows<T extends { created_at: number }>(
  rows: T[],
  ...comparators: ((a: T, b: T) => number)[]
): T[] {
  return rows.sort((a, b) => {
    for (const compare of comparators) {
      const result = compare(a, b);
      if (result !== 0) return result;
    }
    return a.created_at - b.created_at;
  });
}
