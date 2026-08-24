'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          theme?: 'light' | 'dark' | 'auto';
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function useDocsTurnstile(action: string) {
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';

  const resetTurnstile = useCallback(() => {
    setTurnstileToken('');
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  useEffect(() => {
    if (!siteKey || !turnstileRef.current) return;

    let cancelled = false;

    function unmount() {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    }

    function mount() {
      if (cancelled || !turnstileRef.current || !window.turnstile) return;
      unmount();
      setTurnstileToken('');
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: siteKey,
        action,
        theme: 'auto',
        callback: (token) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken(''),
      });
    }

    if (window.turnstile) {
      mount();
      return () => {
        cancelled = true;
        unmount();
      };
    }

    const existing = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]',
    );
    if (existing) {
      existing.addEventListener('load', mount);
      return () => {
        cancelled = true;
        existing.removeEventListener('load', mount);
        unmount();
      };
    }

    const script = document.createElement('script');
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = mount;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      unmount();
    };
  }, [siteKey, action]);

  return { siteKey, turnstileRef, turnstileToken, resetTurnstile };
}
