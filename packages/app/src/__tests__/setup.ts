import "@testing-library/jest-dom";
// Installed before any test module loads, since Dexie reads the global
// IndexedDB API when it's first imported.
import "fake-indexeddb/auto";
