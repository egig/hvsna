import { useEffect } from "react";
import { usePostHog } from "@posthog/react";

const SESSION_KEY = "ph_session_tracked";

export function PostHogSessionTracker() {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    posthog.capture("app_opened", {
      referrer: document.referrer || null,
      url: window.location.href,
    });

    sessionStorage.setItem(SESSION_KEY, "1");
  }, [posthog]);

  return null;
}
