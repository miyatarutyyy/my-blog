export const PAGE_TRANSITION_EXIT_MS = 420;
export const PAGE_TRANSITION_ENTER_MS = 260;

export type PageTransitionClick = {
  button: number;
  defaultPrevented: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

type ShouldHandlePageTransitionInput = {
  click: PageTransitionClick;
  href: string;
  target?: string;
  currentUrl: string;
};

export function shouldHandlePageTransition({
  click,
  href,
  target,
  currentUrl,
}: ShouldHandlePageTransitionInput) {
  if (
    click.defaultPrevented ||
    click.button !== 0 ||
    click.metaKey ||
    click.ctrlKey ||
    click.shiftKey ||
    click.altKey ||
    target === "_blank"
  ) {
    return false;
  }

  let nextUrl: URL;
  let current: URL;

  try {
    current = new URL(currentUrl);
    nextUrl = new URL(href, current);
  } catch {
    return false;
  }

  if (nextUrl.origin !== current.origin) {
    return false;
  }

  return nextUrl.pathname !== current.pathname;
}
