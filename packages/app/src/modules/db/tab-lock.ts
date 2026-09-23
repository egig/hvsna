/**
 * The app runs in one tab at a time: two tabs would run their own sync
 * loops and reminder scheduling against the same data. Same name the
 * SQLite-based builds used, so a tab still running one of those also
 * blocks this one (and the other way round).
 */
const TAB_LOCK_NAME = "hvsna-sqlite-db";

/**
 * Resolves once this tab holds the exclusive tab lock, which it then keeps
 * for its whole lifetime (the browser releases it when the tab closes or
 * reloads). If another tab holds it, calls `onStateChange("locked")` right
 * away and `onStateChange("ready")` once the lock is granted. Browsers
 * without the Web Locks API skip the lock rather than never starting.
 */
export function acquireTabLock(
  onStateChange: (state: "locked" | "ready") => void = () => {}
): Promise<void> {
  if (!navigator.locks) return Promise.resolve();
  return new Promise<void>((resolveHeld) => {
    const holdForever = () => new Promise<void>(() => {});
    void navigator.locks.request(TAB_LOCK_NAME, { ifAvailable: true }, async (lock) => {
      if (lock) {
        resolveHeld();
        return holdForever();
      }
      onStateChange("locked");
      await navigator.locks.request(TAB_LOCK_NAME, async () => {
        onStateChange("ready");
        resolveHeld();
        return holdForever();
      });
    });
  });
}
