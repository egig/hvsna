import { useEffect } from "react";
import { createRoot, type Container } from "react-dom/client";
import type { Route } from "./+types/$space.$";
import App from "../.client/app";
import type { AppConfig } from "../.client/app";
import { registerSW } from "virtual:pwa-register";

export default function Space({ params }: Route.ActionArgs) {
  useEffect(() => {
    // @ts-ignore
    if (!!window.__dtMounted) {
      return;
    }

    const config: AppConfig = {
      basePath: import.meta.env.VITE_API_BASE,
      appBaseName: `/${params.space}`,
      clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!,
      supabaseURL: import.meta.env.VITE_SUPABASE_URL!,
      supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    };

    const root = createRoot(document.getElementById("root") as Container);

    (async () => {
      // console.log((new Clerk()).session?.getToken())
      root.render(<App config={config} />);
      // @ts-ignore
      window.__dtMounted = true;
      window.document.title = "HVSNA";
    })();

    const updateSW = registerSW({
      onOfflineReady() {
        console.log("App ready to work offline");
      },
      onNeedRefresh() {
        console.log("New content available, please refresh");
      },
    });

    return () => {
      updateSW();
    };
  }, []);

  return (
    <>
      <noscript>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            padding: "20px",
            textAlign: "center",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "16px", color: "#333" }}>
              JavaScript Required
            </h1>
            <p style={{ color: "#666", lineHeight: "1.5" }}>
              This application requires JavaScript to function properly. Please
              enable JavaScript in your browser and refresh the page.
            </p>
          </div>
        </div>
      </noscript>
      <div id="root" style={{ height: "100%" }} />
    </>
  );
}
