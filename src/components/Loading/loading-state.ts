export type LoadingFontKind = "system" | "web";

export type LoadingFontStatus =
  "idle" | "loading" | "ready" | "timeout" | "failed";

export type LoadingFontDefinition = {
  id: string;
  kind: LoadingFontKind;
  label: string;
  fontFamily: string;
  sampleText: string;
};

export type LoadingFontState = LoadingFontDefinition & {
  status: LoadingFontStatus;
};

export type InitialLoadingMode = "boot" | "wait-for-fonts" | "ready";

const LOADING_STATUS_LABELS = [
  "[ #.... ]",
  "[ .#... ]",
  "[ ..#.. ]",
  "[ ...#. ]",
  "[ ....# ]",
] as const;

export function createInitialFontStates(
  fonts: readonly LoadingFontDefinition[]
): LoadingFontState[] {
  return fonts.map((font) => ({
    ...font,
    status: font.kind === "system" ? "ready" : "idle",
  }));
}

export function getWebFonts(fonts: readonly LoadingFontDefinition[]) {
  return fonts.filter((font) => font.kind === "web");
}

export function getFontStatusLabel(
  status: LoadingFontStatus,
  loadingFrame: number
) {
  if (status === "ready") {
    return "[ READY ]";
  }

  if (status === "loading") {
    return LOADING_STATUS_LABELS[loadingFrame % LOADING_STATUS_LABELS.length];
  }

  if (status === "timeout") {
    return "[TIMEOUT]";
  }

  if (status === "failed") {
    return "[ ERROR ]";
  }

  return "[ ----- ]";
}

export function getNextLoadingFrame(frame: number) {
  return (frame + 1) % LOADING_STATUS_LABELS.length;
}

export function getInitialLoadingMode({
  hasSeenBootAnimation,
  areWebFontsReady,
}: {
  hasSeenBootAnimation: boolean;
  areWebFontsReady: boolean;
}): InitialLoadingMode {
  if (!hasSeenBootAnimation) {
    return "boot";
  }

  if (areWebFontsReady) {
    return "ready";
  }

  return "wait-for-fonts";
}
