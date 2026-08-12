import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "@/app";
import "@/main.css";

// Deliberately a fresh client render (not hydrateRoot) even though dist/ ships
// prerendered HTML per route: the prerendered markup exists for crawlers/social
// scrapers, not for hydration. A full client remount avoids hydration-mismatch
// classes of bugs (theme/localStorage differing between server and client) at
// the cost of a very brief flash on first paint.
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
