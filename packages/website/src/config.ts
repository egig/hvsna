export const SUPPORT_EMAIL = "support@hvsna.com";

// Native app store listings.
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.hvsna.app";

// The live @hvsna/app deployment (sign in/up, tasks, sync, subscription checkout).
export const WEB_APP_URL = "https://app.hvsna.com";
export const WEB_APP_SIGNUP_URL = `${WEB_APP_URL}`;
export const WEB_APP_SIGNIN_URL = `${WEB_APP_URL}/signin`;

// @hvsna/api base URL, used for the client-side pricing fetch. Configure via
// VITE_API_URL in production; falls back to the local dev server.
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
