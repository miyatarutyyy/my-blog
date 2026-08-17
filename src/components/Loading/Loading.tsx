"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { getPrimaryFontFamily } from "./font-family";
import {
  createInitialFontStates,
  getInitialLoadingMode,
  getFontStatusLabel,
  getNextLoadingFrame,
  getWebFonts,
  type InitialLoadingMode,
  type LoadingFontDefinition,
  type LoadingFontState,
} from "./loading-state";
import { LoadingReadyContext } from "./loading-ready";
import styles from "./Loading.module.css";

const BOOT_ANIMATION_SESSION_KEY = "archivyyy:boot-animation-seen";
const FONT_LOAD_TIMEOUT_MS = 2500;
const FRAME_INTERVAL_MS = 220;
const MIN_FONT_ANIMATION_MS = 660;
const FINAL_TRANSITION_MS = 1500;
const CLEAR_ANIMATION_RATIO = 0.7;
const CLEAR_ANIMATION_MS = FINAL_TRANSITION_MS * CLEAR_ANIMATION_RATIO;
const FINAL_STILL_DELAY_MS = FINAL_TRANSITION_MS - CLEAR_ANIMATION_MS;

type LoadingOverlayStyle = CSSProperties & {
  "--loading-clear-animation-duration": string;
};

type LoadingProps = {
  children: ReactNode;
  fonts: readonly LoadingFontDefinition[];
};

type LoadingDisplayMode = "checking" | InitialLoadingMode;

export function Loading({ children, fonts }: LoadingProps) {
  const fontDefinitions = useMemo(() => fonts, [fonts]);
  const [fontStates, setFontStates] = useState<LoadingFontState[]>(() =>
    createInitialFontStates(fontDefinitions)
  );
  const [activeSampleFontId, setActiveSampleFontId] = useState(
    () =>
      fontStates.find((font) => font.status === "ready")?.id ??
      fontDefinitions[0]?.id
  );
  const [loadingFrame, setLoadingFrame] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [displayMode, setDisplayMode] =
    useState<LoadingDisplayMode>("checking");
  const activeSampleFont =
    fontStates.find((font) => font.id === activeSampleFontId) ?? fontStates[0];
  const overlayStyle: LoadingOverlayStyle = {
    "--loading-clear-animation-duration": `${CLEAR_ANIMATION_MS}ms`,
  };
  const shouldShowOverlay = displayMode === "boot" && !isReady;
  const shouldBlockContent =
    (displayMode === "checking" || displayMode === "wait-for-fonts") &&
    !isReady;

  useEffect(() => {
    const fontFaceSet = document.fonts;
    const timeoutIds: number[] = [];
    let isActive = true;

    const wait = (ms: number) => {
      return new Promise<void>((resolve) => {
        const timeoutId = window.setTimeout(resolve, ms);
        timeoutIds.push(timeoutId);
      });
    };

    const completeLoading = () => {
      setDisplayMode("ready");
      setIsReady(true);
    };

    const setDisplayedFontStatus = (
      id: string,
      status: LoadingFontState["status"]
    ) => {
      setFontStates((currentFontStates) =>
        currentFontStates.map((font) => {
          return font.id === id ? { ...font, status } : font;
        })
      );

      if (status === "ready") {
        setActiveSampleFontId(id);
      }
    };

    const loadFont = (font: LoadingFontDefinition) => {
      const fontQuery = `1rem ${getPrimaryFontFamily(font.fontFamily)}`;

      if (!fontFaceSet || fontFaceSet.check(fontQuery)) {
        return Promise.resolve<LoadingFontState["status"]>("ready");
      }

      return Promise.race<LoadingFontState["status"]>([
        fontFaceSet.load(fontQuery).then(
          () => "ready",
          () => "failed"
        ),
        wait(FONT_LOAD_TIMEOUT_MS).then(() => "timeout"),
      ]);
    };

    const webFonts = getWebFonts(fontDefinitions);
    const areWebFontsReady = webFonts.every((font) => {
      const fontQuery = `1rem ${getPrimaryFontFamily(font.fontFamily)}`;

      return !fontFaceSet || fontFaceSet.check(fontQuery);
    });

    async function waitForWebFontsWithoutBootAnimation() {
      await Promise.all(webFonts.map((font) => loadFont(font)));
    }

    async function playLoadingSequence(
      fontLoadResults: Map<string, Promise<LoadingFontState["status"]>>
    ) {
      await wait(0);

      for (const font of webFonts) {
        if (!isActive) {
          return;
        }

        setActiveSampleFontId(font.id);
        setLoadingFrame(0);
        setDisplayedFontStatus(font.id, "loading");

        await wait(MIN_FONT_ANIMATION_MS);

        const status = await fontLoadResults.get(font.id);

        if (!isActive) {
          return;
        }

        setDisplayedFontStatus(font.id, status ?? "failed");
      }

      await wait(FINAL_STILL_DELAY_MS);

      if (!isActive) {
        return;
      }

      setIsClearing(true);

      await wait(CLEAR_ANIMATION_MS);

      if (isActive) {
        completeLoading();
      }
    }

    async function runLoading() {
      const initialLoadingMode = getInitialLoadingMode({
        hasSeenBootAnimation: hasSeenBootAnimation(),
        areWebFontsReady,
      });

      setDisplayMode(initialLoadingMode);

      if (initialLoadingMode === "ready") {
        completeLoading();
        return;
      }

      if (initialLoadingMode === "wait-for-fonts") {
        await waitForWebFontsWithoutBootAnimation();

        if (isActive) {
          completeLoading();
        }

        return;
      }

      const fontLoadResults = new Map(
        webFonts.map((font) => [font.id, loadFont(font)])
      );

      await playLoadingSequence(fontLoadResults);

      if (isActive) {
        markBootAnimationSeen();
      }
    }

    runLoading();

    return () => {
      isActive = false;
      timeoutIds.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, [fontDefinitions]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReduceMotion = () => {
      setReduceMotion(mediaQuery.matches);
    };
    const readyId = window.setTimeout(updateReduceMotion, 0);

    mediaQuery.addEventListener("change", updateReduceMotion);

    return () => {
      window.clearTimeout(readyId);
      mediaQuery.removeEventListener("change", updateReduceMotion);
    };
  }, []);

  useEffect(() => {
    if (displayMode !== "boot" || isReady || reduceMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setLoadingFrame(getNextLoadingFrame);
    }, FRAME_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [displayMode, isReady, reduceMotion]);

  return (
    <LoadingReadyContext.Provider value={isReady}>
      {children}
      {shouldBlockContent ? (
        <div className={styles.overlay} aria-hidden="true" />
      ) : null}
      {shouldShowOverlay ? (
        <div
          className={`${styles.overlay} ${isClearing ? styles.overlayClearing : ""}`}
          role="status"
          aria-live="polite"
          style={overlayStyle}
        >
          <div className={styles.panel}>
            <div className={styles.sample} aria-hidden="true">
              {activeSampleFont ? (
                <span style={{ fontFamily: activeSampleFont.fontFamily }}>
                  {activeSampleFont.sampleText}
                </span>
              ) : null}
            </div>
            <span className={styles.divider} aria-hidden="true" />
            <ul className={styles.fontList}>
              {fontStates.map((font) => (
                <li
                  className={`${styles.fontItem} ${styles[getFontStatusClassName(font.status)]}`}
                  key={font.id}
                >
                  <span className={styles.status}>
                    {getFontStatusLabel(
                      font.status,
                      reduceMotion ? 1 : loadingFrame
                    )}
                  </span>
                  <span
                    className={styles.fontName}
                    style={{ fontFamily: font.fontFamily }}
                  >
                    {font.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </LoadingReadyContext.Provider>
  );
}

function hasSeenBootAnimation() {
  try {
    return window.sessionStorage.getItem(BOOT_ANIMATION_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

function markBootAnimationSeen() {
  try {
    window.sessionStorage.setItem(BOOT_ANIMATION_SESSION_KEY, "true");
  } catch {
    return;
  }
}

function getFontStatusClassName(status: LoadingFontState["status"]) {
  if (status === "ready") {
    return "fontItemReady";
  }

  if (status === "loading") {
    return "fontItemLoading";
  }

  if (status === "timeout") {
    return "fontItemTimeout";
  }

  if (status === "failed") {
    return "fontItemFailed";
  }

  return "fontItemIdle";
}
