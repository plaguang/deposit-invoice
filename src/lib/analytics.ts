export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;
  try {
    const w = window as unknown as {
      gtag?: (cmd: string, name: string, p?: Record<string, unknown>) => void;
    };
    if (typeof w.gtag === "function") {
      w.gtag("event", eventName, params);
    }
  } catch {
    // 忽略统计拦截异常
  }
}

export const trackToolEvent = trackEvent;
