import { useEffect } from "react";
import { createRoot, type Container } from "react-dom/client";
import type { Route } from "./+types/$space.$";
import { useParams } from "react-router";
import App from "../.client/app";
import type { DatabaseConfig } from "~/lib/database";
import { get } from "~/lib/database";
import type { AppConfig } from "../.client/app";
import { createClient } from '@supabase/supabase-js';
import sync from "~/lib/sync";
import { useSession } from "@clerk/clerk-react";
 
export default function Space({params}: {params: {space: string}}) {
  useEffect(() => {
    // @ts-ignore
    if (!!window.__dtMounted) {
      return;
    }
    const config: AppConfig = {
      basePath: import.meta.env.VITE_API_BASE,
      appBaseName: `/${params.space}`,
      clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!,
    };

    const dbConfig: DatabaseConfig = {
      name: params.space as string,
      devMode: import.meta.env.DEV,
    };
    
    
    const root = createRoot(document.getElementById("root") as Container);

    (async () => {
      // console.log((new Clerk()).session?.getToken())

      const db = await get(dbConfig);
      root.render(<App config={config} db={db} />);
      // @ts-ignore
      window.__dtMounted = true;
      window.document.title = "HVSNA";
    })(); 

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
