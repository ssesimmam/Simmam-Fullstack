import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: any) => string;
      remove: (widgetId: string) => void;
    };
    __turnstilePromise?: Promise<void>;
  }
}

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

function loadTurnstileScript(): Promise<void> {
  const win = window as Window & { __turnstilePromise?: Promise<void> };

  if (win.__turnstilePromise) {
    return win.__turnstilePromise;
  }

  win.__turnstilePromise = new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
    if (existingScript) {
      if (window.turnstile) {
        resolve();
        return;
      }

      existingScript.addEventListener(
        "load",
        () => {
          resolve();
        },
        { once: true },
      );
      existingScript.addEventListener(
        "error",
        () => {
          reject(new Error("Failed to load Turnstile script"));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile script"));
    document.body.appendChild(script);
  });

  return win.__turnstilePromise;
}

type TurnstileProps = {
  siteKey: string;
  onSuccess?: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
  className?: string;
};

export function Turnstile({
  siteKey,
  onSuccess,
  onExpire,
  onError,
  theme = "auto",
  className = "",
}: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const onSuccessRef = useRef(onSuccess);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  }, [onSuccess, onExpire, onError]);

  useEffect(() => {
    if (!ref.current) return;

    let mounted = true;

    loadTurnstileScript()
      .then(() => {
        if (!mounted || !ref.current) return;

        if (window.turnstile && typeof window.turnstile.render === "function") {
          widgetId.current = window.turnstile.render(ref.current, {
            sitekey: siteKey,
            theme,
            callback: (token: string) => onSuccessRef.current?.(token),
            "expired-callback": () => onExpireRef.current?.(),
            "error-callback": () => onErrorRef.current?.(),
          });
        } else {
          console.error("Turnstile script loaded, but window.turnstile is not available.");
          onErrorRef.current?.();
        }
      })
      .catch((error) => {
        console.error("Failed to load Turnstile script:", error);
        onErrorRef.current?.();
      });

    return () => {
      mounted = false;
      if (widgetId.current && window.turnstile && typeof window.turnstile.remove === "function") {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey, theme]);

  // SSR: render a stable placeholder to preserve layout
  return <div ref={ref} className={className} style={{ minHeight: 65 }} />;
}
