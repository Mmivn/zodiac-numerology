"use client";

import { useEffect } from "react";

/**
 * Sets a single global CSS custom property (`--scroll-y`, in pixels) on
 * <html>, updated on scroll via a requestAnimationFrame-throttled
 * listener. Every parallax layer (globals.css's `.starfield-parallax-*`
 * and `.planet-parallax-*`) reads it back through its own
 * `--parallax-speed` multiplier in a `calc()` — this is the only place
 * that touches the DOM on scroll; everything else is pure CSS. Renders
 * nothing.
 *
 * Deliberately inert on mobile and whenever the user prefers reduced
 * motion: no listener is attached at all in either case, so
 * `--scroll-y` simply stays unset and every parallax transform
 * resolves to its `0px` fallback — no heavy parallax on mobile, no
 * motion when the OS says not to animate.
 */
export default function ScrollParallax() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktopWidth = window.matchMedia("(min-width: 768px)").matches;
    if (prefersReducedMotion || !isDesktopWidth) return;

    let ticking = false;
    function apply() {
      document.documentElement.style.setProperty("--scroll-y", `${window.scrollY}px`);
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.style.removeProperty("--scroll-y");
    };
  }, []);

  return null;
}
