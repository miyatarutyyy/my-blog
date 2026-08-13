"use client";

import type { ReactNode } from "react";

import { useLoadingReady } from "@/src/components/Loading/loading-ready";

import styles from "./page.module.css";

type HomeIntroProps = {
  children: ReactNode;
};

export function HomeIntro({ children }: HomeIntroProps) {
  const loadingReady = useLoadingReady();
  const className = loadingReady
    ? `${styles.container} ${styles.containerReady}`
    : styles.container;

  return <div className={className}>{children}</div>;
}
