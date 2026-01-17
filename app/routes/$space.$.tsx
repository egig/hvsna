import { useEffect } from "react";
import { createRoot, type Container } from "react-dom/client";
import type { Route } from "./+types/$space.$";
import { redirect, useLoaderData, useParams } from "react-router";
import App from "../.client/app";

export default function Space() {
  const data = useLoaderData();
  const params = useParams();
  useEffect(() => {
    // @ts-ignore
    if (!!window.__dtMounted) {
      return;
    }
    const config = {
      basePath: import.meta.env.VITE_API_BASE,
      appBaseName: `/${params.space}`,
    };

    const root = document.getElementById("root");
    createRoot(root as Container).render(<App config={config} />);
    // @ts-ignore
    window.__dtMounted = true;
    window.document.title = "HVSNA";
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
