"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

import { shouldHandlePageTransition } from "./page-transition";
import { usePageTransition } from "./PageTransitionProvider";

type TransitionLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    href: string;
  };

export function TransitionLink({
  children,
  href,
  onClick,
  target,
  ...props
}: TransitionLinkProps) {
  const { navigateWithTransition } = usePageTransition();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (
      !shouldHandlePageTransition({
        click: event,
        href,
        target,
        currentUrl: window.location.href,
      })
    ) {
      return;
    }

    event.preventDefault();
    navigateWithTransition(href);
  };

  return (
    <Link href={href} onClick={handleClick} target={target} {...props}>
      {children}
    </Link>
  );
}
