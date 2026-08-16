"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  compileSkkFramesSafely,
  type SkkFrame,
  type SkkInputPlan,
} from "@/lib/skk-typing";
import { useLoadingReady } from "@/src/components/Loading/loading-ready";

import styles from "./SkkTyping.module.css";

const START_DELAY_MS = 400;
const FRAME_INTERVAL_MS = 100;
const INTERSECTION_THRESHOLD = 0.5;

type PlaybackStatus = "idle" | "playing";

type SkkTypingProps = {
  label: string;
  plan: SkkInputPlan;
  className?: string;
  onComplete?: () => void;
};

export function SkkTyping({
  label,
  plan,
  className,
  onComplete,
}: SkkTypingProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const hasPlayedRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>("idle");
  const [frameIndex, setFrameIndex] = useState(0);
  const reduceMotion = usePrefersReducedMotion();
  const loadingReady = useLoadingReady();

  const compileResult = useMemo(() => {
    return compileSkkFramesSafely(plan, label);
  }, [label, plan]);

  useEffect(() => {
    if (compileResult.ok) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to compile SKK typing plan.", compileResult.error);
    }
  }, [compileResult]);

  useEffect(() => {
    if (
      !loadingReady ||
      reduceMotion ||
      !compileResult.ok ||
      compileResult.frames.length === 0
    ) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    let startTimer: ReturnType<typeof setTimeout> | undefined;
    let observer: IntersectionObserver | undefined;

    const stopTimers = () => {
      if (startTimer) {
        clearTimeout(startTimer);
      }

      observer?.disconnect();
    };

    const play = () => {
      if (hasPlayedRef.current) {
        return;
      }

      startTimer = setTimeout(() => {
        hasPlayedRef.current = true;
        setPlaybackStatus("playing");
        setFrameIndex(0);
      }, START_DELAY_MS);
    };

    const animationFrame = requestAnimationFrame(() => {
      if (isElementInViewport(root) || !("IntersectionObserver" in window)) {
        play();
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            play();
            observer?.disconnect();
          }
        },
        { threshold: INTERSECTION_THRESHOLD }
      );

      observer.observe(root);
    });

    return () => {
      cancelAnimationFrame(animationFrame);
      stopTimers();
    };
  }, [compileResult, loadingReady, reduceMotion]);

  useEffect(() => {
    if (
      playbackStatus !== "playing" ||
      !compileResult.ok ||
      compileResult.frames.length === 0
    ) {
      return;
    }

    if (frameIndex >= compileResult.frames.length - 1) {
      return;
    }

    const frameTimer = setTimeout(() => {
      setFrameIndex((currentFrameIndex) => {
        return Math.min(currentFrameIndex + 1, compileResult.frames.length - 1);
      });
    }, FRAME_INTERVAL_MS);

    return () => {
      clearTimeout(frameTimer);
    };
  }, [compileResult, frameIndex, playbackStatus]);

  useEffect(() => {
    if (!loadingReady || hasCompletedRef.current) {
      return;
    }

    const completedWithoutPlayback =
      reduceMotion ||
      !compileResult.ok ||
      (compileResult.ok && compileResult.frames.length === 0);

    const reachedFinalFrame =
      playbackStatus === "playing" &&
      compileResult.ok &&
      compileResult.frames.length > 0 &&
      frameIndex >= compileResult.frames.length - 1;

    if (!completedWithoutPlayback && !reachedFinalFrame) {
      return;
    }

    hasCompletedRef.current = true;
    onComplete?.();
  }, [
    compileResult,
    frameIndex,
    loadingReady,
    onComplete,
    playbackStatus,
    reduceMotion,
  ]);

  const rootClassName = className ? `${styles.root} ${className}` : styles.root;
  const frame = compileResult.ok ? compileResult.frames[frameIndex] : null;
  const showCursor =
    compileResult.ok &&
    !reduceMotion &&
    playbackStatus === "playing" &&
    frameIndex < compileResult.frames.length - 1;
  const visualLabel = reduceMotion || !compileResult.ok ? label : null;
  return (
    <span className={rootClassName} ref={rootRef}>
      <span className={styles.visual} aria-hidden="true">
        <span className={styles.reserve}>{label}</span>
        <span className={styles.live}>
          {visualLabel ??
            (playbackStatus === "idle" || !frame ? null : (
              <SkkFrameView frame={frame} />
            ))}
          {showCursor ? <span className={styles.cursor} /> : null}
        </span>
      </span>
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}

function isElementInViewport(element: Element) {
  const rect = element.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top < viewportHeight &&
    rect.bottom > 0 &&
    rect.left < viewportWidth &&
    rect.right > 0
  );
}

function SkkFrameView({ frame }: { frame: SkkFrame }) {
  return (
    <>
      <span className={styles.committed}>{frame.committed}</span>
      {frame.marker ? (
        <span className={styles.marker}>{frame.marker}</span>
      ) : null}
      {frame.composing ? (
        <span className={styles.composing} data-skk-phase={frame.phase}>
          {frame.composing}
        </span>
      ) : null}
    </>
  );
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
