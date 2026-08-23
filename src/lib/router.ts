// Minimal History-API router — two routes ("/" home, "/review-errors") don't
// justify a dependency. Navigation reuses the popstate event so a single
// listener per hook keeps them in sync with browser back/forward too.

import { useEffect, useState } from "react";

/** Collapse trailing slashes so "/review-errors/" and "/review-errors" match. */
export function normalizePath(p: string): string {
  return p.length > 1 && p.endsWith("/") ? p.replace(/\/+$/, "") : p || "/";
}

export function currentPath(): string {
  return normalizePath(window.location.pathname);
}

export function navigate(path: string): void {
  if (currentPath() === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

export function usePath(): string {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);
  return path;
}
