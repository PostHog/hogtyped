'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
// This is the GENERATED wrapper - schemas are embedded!
import { posthog } from '@/lib/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views
  useEffect(() => {
    if (pathname) {
      // Full type safety - IDE autocompletes properties!
      posthog.capture('page_viewed', {
        url: window.location.href,
        path: pathname,
        search: searchParams?.toString() || '',
        referrer: document.referrer,
        title: document.title
      });
    }
  }, [pathname, searchParams]);

  // Initialize PostHog (already done in generated wrapper)
  useEffect(() => {
    // The generated wrapper already has everything initialized
    // No need to load schemas or configure - it's all baked in!
    console.log('PostHog ready with embedded schemas');
  }, []);

  return <>{children}</>;
}