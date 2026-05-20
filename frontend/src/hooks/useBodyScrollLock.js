import { useEffect } from 'react';

/**
 * Locks the body scroll while a modal/dialog is open.
 * Automatically restores scroll on unmount or when `isOpen` changes to false.
 */
export function useBodyScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);
}
