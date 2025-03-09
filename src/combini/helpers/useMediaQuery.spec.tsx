import { renderHook } from "@testing-library/react";
import { useMediaQuery } from "./useMediaQuery";

describe("useMediaQuery", () => {
  let matchMedia: jasmine.Spy;
  let addListener: jasmine.Spy;
  let removeListener: jasmine.Spy;

  beforeEach(() => {
    addListener = jasmine.createSpy("addEventListener");
    removeListener = jasmine.createSpy("removeEventListener");

    matchMedia = jasmine.createSpy("matchMedia").and.returnValue({
      matches: false,
      addEventListener: addListener,
      removeEventListener: removeListener,
    });

    (window as any).matchMedia = matchMedia;
  });

  it("should return false by default", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("should call matchMedia with the provided query", () => {
    const query = "(min-width: 768px)";
    renderHook(() => useMediaQuery(query));
    expect(matchMedia).toHaveBeenCalledWith(query);
  });

  it("should add event listener on mount", () => {
    renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(addListener).toHaveBeenCalledWith("change", jasmine.any(Function));
  });

  it("should remove event listener on unmount", () => {
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    unmount();
    expect(removeListener).toHaveBeenCalledWith(
      "change",
      jasmine.any(Function),
    );
  });
});
