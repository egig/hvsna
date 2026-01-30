import { motion } from "framer-motion";
import { useLocation } from "react-router";
import { useEffect, type ReactNode } from "react";
import { useNavigation } from "../contexts/NavigationContext";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const { navType, setNavType } = useNavigation();
  const stateNavType = (location.state as { navType?: string })?.navType;

  // Use context navType, but allow location state to override for tab switches and modals
  const currentNavType =
    stateNavType === "tab"
      ? "tab"
      : stateNavType === "modal"
        ? "modal"
        : navType;

  // Reset navType to forward after animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setNavType("forward");
    }, 300); // Match animation duration

    return () => clearTimeout(timer);
  }, [location.pathname, setNavType]);

  // Animation variants based on navigation type
  const variants = {
    // Forward navigation (to detail page)
    forward: {
      initial: { x: "100%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "-20%", opacity: 0 },
    },
    // Back navigation
    back: {
      initial: { x: "-20%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "100%", opacity: 0 },
    },
    // Tab switch
    tab: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    // Modal presentation
    modal: {
      initial: { y: "100%", opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: "100%", opacity: 0 },
    },
  };

  const currentVariant =
    variants[currentNavType as keyof typeof variants] || variants.forward;

  return (
    <motion.div
      key={location.pathname}
      initial={currentVariant.initial}
      animate={currentVariant.animate}
      exit={currentVariant.exit}
      transition={{
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      className="h-screen w-full"
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
