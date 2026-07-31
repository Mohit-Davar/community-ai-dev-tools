import React, { useEffect } from "react";

/**
 * Custom hook that detects clicks or touches outside a specified element.
 *
 * @param ref - React ref pointing to the element to monitor.
 * @param callback - Function executed when a click or touch occurs outside the element.
 */
export const useOutsideClick = <T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T | null>,
  callback: (event: MouseEvent | TouchEvent) => void,
) => {
  useEffect(() => {
    // Handles mouse and touch interactions on the document.
    const listener = (event: MouseEvent | TouchEvent) => {
      // If the referenced element does not exist, do nothing.
      if (!ref.current) {
        return;
      }
      // Ignore events that occur inside the referenced element, including any of its child elements.
      if (ref.current.contains(event.target as Node)) {
        return;
      }
      // The interaction occurred outside the element, so invoke the provided callback.
      callback(event);
    };
    // Listen for both mouse and touch interactions to support desktop and mobile devices.
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    // Remove event listeners when the component unmounts or when the dependencies change to prevent memory leaks.
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};
