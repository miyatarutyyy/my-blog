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

import styles from "./SkkTyping.module.css";

const FRAME_INTERVAL_MS = 95;
const INTERSECTION_THRESHOLD = 0.35;

type SkkTypingProps = {
  label: string;
  plan: SkkInputPlan;
  className?: string;
};

export function SkkTyping({ label, plan, className }: SkkTypingProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const hasPlayedRef = useRef(false);
  const [frameIndex, setFrameIndex] = useState<number | null>(null);
  const reduceMotion = usePrefersReducedMotion();

  const compileResult = useMemo(() => {
    return compileSkkFramesSafely(plan, label);
  }, [label, plan]);

  useEffect(() => {
    if (compileResult.ok) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to compile SKK typing plan.", compileResult.error);
    }
  }, [compileResult]);

  useEffect(() => {
    if (
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
    let frameTimer: ReturnType<typeof setInterval> | undefined;

    const stopTimers = () => {
      if (startTimer) {
        clearTimeout(startTimer);
      }

      if (frameTimer) {
        clearInterval(frameTimer);
      }
    };

    const play = () => {
      if (hasPlayedRef.current) {
        return;
      }

      startTimer = setTimeout(() => {
        hasPlayedRef.current = true;
        setFrameIndex(0);

        frameTimer = setInterval(() => {
          setFrameIndex((currentFrameIndex) => {
            if (currentFrameIndex === null) {
              return 0;
            }

            const nextFrameIndex = currentFrameIndex + 1;

            if (nextFrameIndex >= compileResult.frames.length) {
              if (frameTimer) {
                clearInterval(frameTimer);
              }

              return compileResult.frames.length - 1;
            }

            return nextFrameIndex;
          });
        }, FRAME_INTERVAL_MS);
      }, FRAME_INTERVAL_MS);
    };

    if (!("IntersectionObserver" in window)) {
      play();

      return stopTimers;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          play();
          observer.disconnect();
        }
      },
      { threshold: INTERSECTION_THRESHOLD }
    );

    observer.observe(root);

    return () => {
      observer.disconnect();
      stopTimers();
    };
  }, [compileResult, reduceMotion]);

  const rootClassName = className ? `${styles.root} ${className}` : styles.root;
  const frame =
    compileResult.ok && frameIndex !== null
      ? compileResult.frames[frameIndex]
      : null;
  const showCursor =
    compileResult.ok &&
    !reduceMotion &&
    frameIndex !== null &&
    frameIndex < compileResult.frames.length - 1;
  const visualLabel = reduceMotion || !compileResult.ok ? label : null;
  const reserveText = compileResult.ok
    ? getLongestDisplayText(label, compileResult.frames)
    : label;

  return (
    <span className={rootClassName} ref={rootRef}>
      <span className={styles.visual} aria-hidden="true">
        <span className={styles.reserve}>{reserveText}</span>
        <span className={styles.live}>
          {visualLabel ?? (frame ? <SkkFrameView frame={frame} /> : label)}
          {showCursor ? <span className={styles.cursor} /> : null}
        </span>
      </span>
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}

function getLongestDisplayText(label: string, frames: readonly SkkFrame[]) {
  return frames.reduce((longest, frame) => {
    const text = formatFrame(frame);

    return text.length > longest.length ? text : longest;
  }, label);
}

function formatFrame(frame: SkkFrame) {
  return `${frame.committed}${frame.marker ?? ""}${frame.composing}`;
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
