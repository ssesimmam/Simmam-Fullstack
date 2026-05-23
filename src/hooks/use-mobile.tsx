import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Use a deterministic initial value so server and first client render match.
  // Avoid `undefined` which can cause different boolean coercions between
  // server and client (hydration mismatch). Default to `false` and update
  // on mount via `useEffect`.
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    let cleanup: (() => void) | undefined;

    try {
      mql.addEventListener("change", onChange);
      cleanup = () => mql.removeEventListener("change", onChange);
    } catch {
      // Some environments may not support addEventListener on MediaQueryList.
      // fall back to deprecated addListener for compatibility.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mql as any).addListener?.(onChange);
      cleanup = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mql as any).removeListener?.(onChange);
      };
    }

    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => cleanup?.();
  }, []);

  return !!isMobile;
}
