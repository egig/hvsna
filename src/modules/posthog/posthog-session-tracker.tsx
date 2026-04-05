import { useEffect } from "react";
import { usePostHog } from "@posthog/react";

const SESSION_KEY = "ph_session_tracked";

export function PostHogSessionTracker({platform}: {platform: "web" | "capacitor"}) {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    posthog.capture("app_opened", {
      referrer: document.referrer || null,
      url: window.location.href,
      platform: platform
    });

    sessionStorage.setItem(SESSION_KEY, "1");
  }, [posthog]);

  return null;
}
