"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GA({ id }: { id: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!window || typeof window.gtag !== "function" || !id) return;
    const search = searchParams?.toString();
    const path = pathname + (search ? `?${search}` : "");
    // Send SPA page_view on route change and first load (send_page_view disabled in init)
    window.gtag("config", id, {
      page_path: path,
      page_location: window.location.href,
      // page_title: document.title, // optional
    });
  }, [id, pathname, searchParams]);

  return null;
}
