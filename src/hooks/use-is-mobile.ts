'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for mobile detection based on viewport width
 * @param breakpoint - The breakpoint in pixels (default: 768px for md breakpoint)
 * @returns boolean indicating if the current viewport is mobile
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check initial value
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);

    // Run on mount
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}
