"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  PAGE_TRANSITION_ENTER_MS,
  PAGE_TRANSITION_EXIT_MS,
} from "./page-transition";
import styles from "./PageTransitionProvider.module.css";

type PageTransitionPhase = "idle" | "exiting" | "covered" | "entering";

type PageTransitionContextValue = {
  navigateWithTransition: (href: string) => void;
};

const PageTransitionContext = createContext<PageTransitionContextValue | null>(
  null
);

type PageTransitionProviderProps = {
  children: ReactNode;
};

export function PageTransitionProvider({
  children,
}: PageTransitionProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const routeKey = pathname;
  const previousRouteKeyRef = useRef(routeKey);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhase] = useState<PageTransitionPhase>("idle");
  const reduceMotion = usePrefersReducedMotion();

  const clearTimeouts = useCallback(() => {
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }
  }, []);

  const navigateWithTransition = useCallback(
    (href: string) => {
      clearTimeouts();
      setPhase("exiting");

      exitTimeoutRef.current = setTimeout(
        () => {
          setPhase("covered");
          router.push(href);
        },
        reduceMotion ? 0 : PAGE_TRANSITION_EXIT_MS
      );
    },
    [clearTimeouts, reduceMotion, router]
  );

  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  useEffect(() => {
    if (previousRouteKeyRef.current === routeKey) {
      return;
    }

    previousRouteKeyRef.current = routeKey;

    if (phase !== "covered" && phase !== "exiting") {
      return;
    }

    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    const enterStartTimeout = setTimeout(() => {
      setPhase("entering");

      enterTimeoutRef.current = setTimeout(
        () => {
          setPhase("idle");
          enterTimeoutRef.current = null;
        },
        reduceMotion ? 0 : PAGE_TRANSITION_ENTER_MS
      );
    }, 0);

    return () => {
      clearTimeout(enterStartTimeout);
    };
  }, [phase, reduceMotion, routeKey]);

  return (
    <PageTransitionContext.Provider value={{ navigateWithTransition }}>
      {children}
      {phase === "idle" ? null : (
        <div
          className={`${styles.overlay} ${styles[phase]}`}
          aria-hidden="true"
        />
      )}
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  const context = useContext(PageTransitionContext);

  if (context == null) {
    throw new Error(
      "usePageTransition must be used within PageTransitionProvider."
    );
  }

  return context;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

function subscribeToReducedMotion(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}
