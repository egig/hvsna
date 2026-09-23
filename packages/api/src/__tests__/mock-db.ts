import { vi } from "vitest";

/**
 * A drizzle-style chainable query builder mock: every intermediate call
 * (.from/.where/.limit/.orderBy/.values/.onConflictDoUpdate/.returning/.set)
 * returns the same chain, and awaiting the chain at any point resolves to
 * `result`.
 */
export function createChain<T>(result: T) {
  const chain = {
    from: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    values: vi.fn(() => chain),
    onConflictDoUpdate: vi.fn(() => chain),
    returning: vi.fn(() => chain),
    set: vi.fn(() => chain),
    then: (
      resolve: (value: T) => unknown,
      reject?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

/** Like createChain, but awaiting it rejects with `error`. */
export function createRejectingChain(error: unknown) {
  const chain = {
    from: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    values: vi.fn(() => chain),
    onConflictDoUpdate: vi.fn(() => chain),
    returning: vi.fn(() => chain),
    set: vi.fn(() => chain),
    then: (
      _resolve: (value: never) => unknown,
      reject?: (reason: unknown) => unknown
    ) => Promise.reject(error).catch(reject),
  };
  return chain;
}

export function createMockDb() {
  return {
    select: vi.fn(() => createChain([])),
    insert: vi.fn(() => createChain([])),
    update: vi.fn(() => createChain([])),
  };
}
