import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "./security";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function TurnstileChallenge({ onToken, resetSignal }: { onToken: (token: string) => void; resetSignal: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !containerRef.current) return;
    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "dark",
        size: "flexible",
        action: "sw-auth",
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };
    let script = document.querySelector<HTMLScriptElement>('script[data-sw-turnstile="true"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.swTurnstile = "true";
      document.head.appendChild(script);
    }
    if (window.turnstile) renderWidget();
    else script.addEventListener("load", renderWidget, { once: true });
    return () => {
      script?.removeEventListener("load", renderWidget);
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = undefined;
    };
  }, [onToken]);

  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onToken("");
    }
  }, [onToken, resetSignal]);

  if (!TURNSTILE_SITE_KEY) return <div className="identity-passive-shield"><i /> SW bot ve hız koruması etkin</div>;
  return <div className="identity-turnstile"><div ref={containerRef} /><span>SW IDENTITY doğrulaması</span></div>;
}
