"use client";

import { createContext, useContext } from "react";

export const LoadingReadyContext = createContext(true);

export function useLoadingReady() {
  return useContext(LoadingReadyContext);
}
