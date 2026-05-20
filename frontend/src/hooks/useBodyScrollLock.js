import { useEffect } from 'react';

/**
 * Locks the body scroll (both axes) while a modal/dialog is open.
 * Prevents the background page from scrolling or shifting on mobile.
 * Automatically restores scroll on unmount or when `isOpen` changes to false.
 */
export function useBodyScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    const html = document.documentElement;
    const body = document.body;

    const originalBodyOverflow = body.style.overflow;
    const originalHtmlOverflow = html.style.overflow;
    const originalBodyPosition = body.style.position;
    const originalBodyWidth = body.style.width;
    const originalBodyTop = body.style.top;
    const scrollY = window.scrollY;

    // Lock the body in place to prevent any scroll (vertical + horizontal)
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.width = '100%';
    body.style.top = `-${scrollY}px`;
    html.style.overflow = 'hidden';

    return () => {
      body.style.overflow = originalBodyOverflow;
      body.style.position = originalBodyPosition;
      body.style.width = originalBodyWidth;
      body.style.top = originalBodyTop;
      html.style.overflow = originalHtmlOverflow;
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);
}
