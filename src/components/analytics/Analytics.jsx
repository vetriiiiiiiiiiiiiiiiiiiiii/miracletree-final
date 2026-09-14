"use client";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { analytics } from "@/lib/analytics";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
function PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef(null);
  useEffect(() => {
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    if (lastPath.current === path) return;
    lastPath.current = path;
    analytics.pageView(path, document.title);
  }, [pathname, searchParams]);
  return null;
}
/** Fires once per threshold crossed, per page. */
function ScrollDepth() {
  const pathname = usePathname();
  useEffect(() => {
    const thresholds = [25, 50, 75, 100];
    const fired = new Set();
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      for (const t of thresholds) {
        if (percent >= t && !fired.has(t)) {
          fired.add(t);
          analytics.scrollDepth(t);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);
  return null;
}
export function Analytics() {
  return (
    <>
      {/* The dataLayer is always present, so events queue even when no tag
            manager is configured. Nothing is lost if GA is added later. */}
      <Script id="datalayer-init" strategy="beforeInteractive">
        {`window.dataLayer = window.dataLayer || [];`}
      </Script>

      {GA_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: false, anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}

      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
      <ScrollDepth />
    </>
  );
}
