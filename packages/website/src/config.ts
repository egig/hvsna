export const SUPPORT_EMAIL = "support@hvsna.com";

// Native app store listings.
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.hvsna.app";

// GitHub Pages serves this site from a subpath (see `base` in vite.config.ts).
// BASENAME is for the router; withBase() is for raw <a href> / <img src> paths.
export const SITE_URL = "https://egig.github.io/hvsna";
export const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, "");
export const withBase = (path: string) => `${BASENAME}${path}`;
