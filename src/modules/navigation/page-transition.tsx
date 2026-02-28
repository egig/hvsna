import { motion } from "framer-motion";
import { useLocation } from "react-router";
import { type ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const stateNavType = (location.state as { navType?: string })?.navType;
  let currentNavType = stateNavType || "tab";

  // Animation variants based on navigation type
  const variants = {
    // Forward navigation (to detail page)
    forward: {
      initial: { x: "100%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "-20%", opacity: 0 },
      duration: 0.3,
    },
    // TODO find a way to use back navigation
    // currently using navigate(-1) or browser back button does not carry new state
    // using custom state make it crash in back navigation
    back: {
      initial: { x: "-20%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "100%", opacity: 0 },
      duration: 0.3,
    },
    // Tab switch
    tab: {
      initial: { opacity: 0.6 },
      animate: { opacity: 1 },
      exit: { opacity: 0.6 },
      duration: 0.1,
    },
    // Modal presentation
    modal: {
      initial: { y: "100%", opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: "100%", opacity: 0 },
      duration: 0.3,
    },
    // Sidebar navigation (desktop)
    sidebar: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      duration: 0.15,
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
        duration: currentVariant.duration,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      className="h-[100%] w-full"
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
