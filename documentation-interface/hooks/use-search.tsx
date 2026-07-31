import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { searchDocumentation } from "@/lib/search";

/**
 * Custom hook that manages documentation search functionality.
 *
 * Features:
 * - Global Ctrl+K / Cmd+K shortcut
 * - Search result filtering
 * - Keyboard navigation
 * - Navigation to selected documentation page
 */
export function useSearch() {
  // Current search query entered by the user.
  const [query, setQuery] = useState("");
  // Controls whether the search dropdown is visible.
  const [isOpen, setIsOpen] = useState(false);
  // Index of the currently highlighted search result.
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Recompute search results only when the query changes.
  const results = useMemo(() => searchDocumentation(query), [query]);

  // Registers a global keyboard shortcut (Ctrl+K / Cmd+K) to focus and open the search input from anywhere in the application.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Remove the event listener when the hook is unmounted.
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /**
   * Handles keyboard interactions while the search
   * dropdown is open.
   *
   * Supported keys:
   * - ArrowDown: Move to next result
   * - ArrowUp: Move to previous result
   * - Enter: Open selected result
   * - Escape: Close search
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        // Move to the next result, wrapping to the first item.
        setSelectedIndex((prev) =>
          results.length > 0 ? (prev + 1) % results.length : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        // Move to the previous result, wrapping to the last item.
        setSelectedIndex((prev) =>
          results.length > 0 ? (prev - 1 + results.length) % results.length : 0,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        // Navigate to the currently selected result.
        if (results[selectedIndex]) {
          handleNavigate(results[selectedIndex].url);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        // Close the search dropdown, remove focus and clean the query.
        inputRef.current?.blur();
        setQuery("");
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Clean up the event listener when dependencies change
    // or when the component unmounts.
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  /**
   * Navigates to the selected documentation page and
   * resets the search state.
   */
  const handleNavigate = (url: string) => {
    router.push(url);
    setIsOpen(false);
    setQuery("");
  };

  return {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    results,
    inputRef,
    handleNavigate,
  };
}
