// wa-sqlite ships type declarations for most of src/examples/*.js (see its
// src/types/index.d.ts), but not for AccessHandlePoolVFS.js — this fills
// that gap with just the surface this app actually uses.
declare module "wa-sqlite/src/examples/AccessHandlePoolVFS.js" {
  export class AccessHandlePoolVFS {
    constructor(directoryPath: string);
    readonly isReady: Promise<void>;
    readonly name: string;
    close(): Promise<void>;
  }
}
