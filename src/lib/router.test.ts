import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { currentPath, navigate, normalizePath, usePath } from "./router";

// jsdom starts every test file at "/" — restore it after navigation tests,
// and silence its "not implemented" scrollTo used by navigate().
afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("normalizePath", () => {
  it("keeps the root and plain paths untouched", () => {
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("/review-errors")).toBe("/review-errors");
    // Empty pathname must not collapse to "" — that would break route matching.
    expect(normalizePath("")).toBe("/");
  });

  it("collapses trailing slashes so both URL forms match one route", () => {
    expect(normalizePath("/review-errors/")).toBe("/review-errors");
    expect(normalizePath("/review-errors///")).toBe("/review-errors");
  });
});

describe("navigate + usePath", () => {
  const spyScroll = () => vi.spyOn(window, "scrollTo").mockImplementation(() => {});

  it("updates the URL and every usePath subscriber", () => {
    spyScroll();
    window.history.replaceState(null, "", "/");
    const { result } = renderHook(() => usePath());
    expect(result.current).toBe("/");

    act(() => navigate("/review-errors"));

    expect(window.location.pathname).toBe("/review-errors");
    expect(result.current).toBe("/review-errors");
  });

  it("is a no-op when already on the target path (no duplicate history entries)", () => {
    spyScroll();
    window.history.replaceState(null, "", "/review-errors");
    const pushSpy = vi.spyOn(window.history, "pushState");
    navigate("/review-errors");
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it("re-renders on popstate so browser back/forward stay in sync", () => {
    // jsdom can't run real session-history traversal, so emulate what the
    // browser dispatches on back/forward.
    const { result } = renderHook(() => usePath());
    expect(result.current).toBe("/");

    window.history.replaceState(null, "", "/review-errors");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current).toBe("/review-errors");
  });

  it("scrolls to top on navigation", () => {
    const scrollTo = spyScroll();
    window.history.replaceState(null, "", "/");
    navigate("/review-errors");
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });
});

describe("currentPath", () => {
  it("reads and normalizes the live location", () => {
    window.history.replaceState(null, "", "/review-errors/");
    expect(currentPath()).toBe("/review-errors");
  });
});
