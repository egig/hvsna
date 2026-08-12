import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useAppNavigation } from "./use-app-navigation";

/**
 * Handles left-edge swipe-back gesture via touch events for mobile web.
 *
 * Must be rendered inside a React Router context.
 */
export function useMobileNavigation() {
  const { goBack } = useAppNavigation();
  const location = useLocation();

  const goBackRef = useRef(goBack);
  goBackRef.current = goBack;
  const locationRef = useRef(location);
  locationRef.current = location;

  // Edge swipe-back gesture
  useEffect(() => {
    const EDGE_THRESHOLD = 30;
    const MIN_SWIPE_DISTANCE = 60;
    const MAX_VERTICAL_DRIFT = 60;

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
      }
    };

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
