/**
 * Google Analytics 4 (gtag). Default Measurement ID is set; override with VITE_GA_MEASUREMENT_ID in .env if needed.
 * @see https://support.google.com/analytics/answer/9304153
 */

const DEFAULT_GA_ID = 'G-BJCKN12FND';

const MEASUREMENT_ID = (
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() || DEFAULT_GA_ID
) as string;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function initAnalytics(): void {
  if (!MEASUREMENT_ID || typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false });

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(s);

  if (import.meta.env.DEV) {
    console.info(
      '[analytics] GA4 queued — id',
      MEASUREMENT_ID,
      '| In Network, filter: gtag OR collect OR googletagmanager (not "google-anal"). If empty: disable ad blocker / Brave shields for localhost.',
    );
  }
}

/** SPA “virtual” page views when the UI screen changes (landing, lobby, game, …). */
export function trackPageView(screen: string): void {
  if (!MEASUREMENT_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const pagePath = `/${screen}`;
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: `Chkobba — ${screen}`,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!MEASUREMENT_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params ?? {});
}
