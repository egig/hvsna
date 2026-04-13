import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { useLocation } from "react-router";
import { useAppNavigation } from "./use-app-navigation";

/**
 * Handles native mobile navigation gestures and hardware buttons:
 * - Android: hardware back button via @capacitor/app
 * - iOS/Android: left-edge swipe-back gesture via touch events
 *
 * Must be rendered inside a React Router context.
 */
export function useMobileNavigation() {
  const { goBack } = useAppNavigation();
  const location = useLocation();

  // Keep stable refs so handlers always use the latest values
  // without needing to re-register listeners on every render.
  const goBackRef = useRef(goBack);
  goBackRef.current = goBack;
  const locationRef = useRef(location);
  locationRef.current = location;

  // Android hardware back button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = App.addListener("backButton", () => {
      if (locationRef.current.key !== "default") {
        goBackRef.current();
      } else {
        App.exitApp();
      }
    });

    return () => {
      listenerPromise.then((h) => h.remove());
    };
  }, []);

  // iOS/Android edge swipe-back gesture
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const EDGE_THRESHOLD = 30; // px from left edge to start a swipe
    const MIN_SWIPE_DISTANCE = 60; // minimum horizontal swipe distance
    const MAX_VERTICAL_DRIFT = 60; // maximum vertical movement allowed

    let startX = 0;
    let startY = 0;
    let isEdgeSwipe = false;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isEdgeSwipe = startX < EDGE_THRESHOLD;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isEdgeSwipe) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);
      if (dx > MIN_SWIPE_DISTANCE && dy < MAX_VERTICAL_DRIFT) {
        if (locationRef.current.key !== "default") {
          goBackRef.current();
        }
        // No exit on swipe — swipe-back at root is a no-op
      }
    };

    // Use capture phase so we receive events even if a child calls stopPropagation
    document.addEventListener("touchstart", onTouchStart, {
      passive: true,
      capture: true,
    });
    document.addEventListener("touchend", onTouchEnd, {
      passive: true,
      capture: true,
    });

    return () => {
      document.removeEventListener("touchstart", onTouchStart, {
        capture: true,
      });
      document.removeEventListener("touchend", onTouchEnd, { capture: true });
    };
  }, []);
}
