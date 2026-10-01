import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Tracks a media query with a safe jsdom/no-matchMedia fallback. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const list = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);
    setMatches(list.matches);
    if (list.addEventListener) list.addEventListener("change", handler);
    else list.addListener?.(handler);
    return () => {
      if (list.removeEventListener) list.removeEventListener("change", handler);
      else list.removeListener?.(handler);
    };
  }, [query]);

  return matches;
}

/**
 * Traps focus inside a dialog, closes on Escape, locks body scroll and
 * restores focus to the element that opened it.
 */
// Stack of open dialogs so nested dialogs (e.g. the asset picker inside the
// album form) behave predictably: only the topmost one answers Escape.
const dialogStack = [];

export function useDialog({ open, onClose, initialFocusRef, restoreFocus = true }) {
  const containerRef = useRef(null);
  const previouslyFocused = useRef(null);
  const stackToken = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    if (typeof document === "undefined") return undefined;

    stackToken.current = {};
    dialogStack.push(stackToken.current);
    previouslyFocused.current = document.activeElement;
    const container = containerRef.current;
    // A dialog may manage its own container element (the mobile drawer does),
    // in which case only `initialFocusRef` is available — still move focus.
    if (!container || !container.hasAttribute("inert")) {
      const focusTarget = initialFocusRef?.current
        || container?.querySelector("[data-autofocus]")
        || container?.querySelector("button:not([disabled]), [href], input, select, textarea")
        || container;
      // Defer so the element exists after the first paint (React commits it first).
      if (focusTarget) window.setTimeout(() => focusTarget.focus?.(), 0);
    }

    const onKeyDown = (event) => {
      // A dialog nested on top owns the keyboard until it closes.
      if (dialogStack[dialogStack.length - 1] !== stackToken.current) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== "Tab" || !container) return;
      // Focus trap stays inside the dialog (drawer and modals alike).
      const focusables = [...container.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])")]
        .filter((element) => element.offsetParent !== null || element === document.activeElement);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const position = dialogStack.indexOf(stackToken.current);
      if (position >= 0) dialogStack.splice(position, 1);
      stackToken.current = null;
      document.body.style.overflow = previousOverflow || "";
      if (restoreFocus && previouslyFocused.current && typeof previouslyFocused.current.focus === "function") {
        previouslyFocused.current.focus();
      }
    };
  }, [open, onClose, initialFocusRef, restoreFocus]);

  return containerRef;
}

/** Tracks an "unsaved changes" flag and hooks browser unload protection. */
export function useUnsavedChanges(dirty) {
  useEffect(() => {
    if (!dirty || typeof window === "undefined") return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}

/** Simple async resource loader with retry + graceful error state. */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ status: "idle", data: null, error: null });
  const mounted = useRef(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", error: null }));
    try {
      const data = await loaderRef.current();
      if (mounted.current) setState({ status: "success", data, error: null });
      return data;
    } catch (error) {
      if (mounted.current) setState({ status: "error", data: null, error });
      return null;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: run };
}

/** Debounces a fast-changing value (search fields, resize work). */
export function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous || "";
    };
  }, [locked]);
}

export function useLocalStorage(key, fallbackValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return fallbackValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? fallbackValue : stored;
    } catch {
      return fallbackValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage may be unavailable (private mode) — the app still works */
    }
  }, [key, value]);

  return [value, setValue];
}

export function useMountedRef() {
  const ref = useRef(true);
  useEffect(() => () => { ref.current = false; }, []);
  return ref;
}

/** Groups a list by a derived key while keeping insertion order. */
export function useGrouped(items, keyFn) {
  return useMemo(() => {
    const map = new Map();
    for (const item of items || []) {
      const key = keyFn(item) || "Lainnya";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()].map(([key, values]) => ({ key, values }));
  }, [items, keyFn]);
}
