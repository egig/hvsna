import type { Page } from "@playwright/test";

/**
 * Delete all PouchDB IndexedDB databases.
 * PouchDB stores data in "_pouch_hvsna-notes" (confirmed from pouchdb-singleton.ts).
 */
export async function resetPouchDB(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    await Promise.all(
      dbs
        .filter((db) => db.name?.startsWith("_pouch_"))
        .map(
          (db) =>
            new Promise<void>((res, rej) => {
              const r = indexedDB.deleteDatabase(db.name!);
              r.onsuccess = () => res();
              r.onerror = () => rej(r.error);
            }),
        ),
    );
  });
}

/**
 * Full reset: clear PouchDB + localStorage, then reload so the
 * PouchDB singleton (module-scoped var) re-initializes from scratch.
 */
export async function fullReset(page: Page): Promise<void> {
  await resetPouchDB(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
}
