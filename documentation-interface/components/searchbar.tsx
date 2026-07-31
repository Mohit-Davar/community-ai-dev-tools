"use client";

import { useRef, useEffect, Fragment } from "react";
import {
  Search,
  CornerDownLeft,
  X,
  FileText,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { products, documentations } from "@/lib/mock-data";
import { SearchResult } from "@/lib/types";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useSearch } from "@/hooks/use-search";
import { useOutsideClick } from "@/hooks/use-outside-click";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function SearchBar() {
  const {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    results,
    inputRef,
    handleNavigate,
  } = useSearch();

  const containerRef = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Hook for handling clicks outside the search container to close it
  useOutsideClick(containerRef, () => {
    setIsOpen(false);
    setQuery("");
  });

  // Keep active/selected result in view when navigating via arrow keys
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector(
        '[data-active="true"]',
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const getBreadcrumbs = (result: SearchResult) => {
    const productObj = products.find((p) => p.id === result.product);
    const docObj = documentations.find((d) => d.id === result.id);
    const path = [];
    if (productObj) {
      path.push(productObj.name);
    }
    if (docObj) {
      if (docObj.source) {
        path.push(docObj.source);
      }
      if (docObj.sections && docObj.sections.length > 0) {
        path.push(docObj.sections[0].title);
      }
    }
    return path;
  };

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Search Input Container */}
      <div
        className={`bg-background flex h-10 items-center rounded-full border px-3 shadow-sm transition-all duration-300 ${
          isOpen
            ? "w-44 border-sky-300 ring-2 ring-sky-400/20 sm:w-72 md:w-96 dark:border-sky-500/60"
            : "border-border/70 hover:border-primary/30 w-28 sm:w-40 sm:w-52"
        }`}
      >
        <div className="flex flex-1 items-center gap-2">
          {isOpen && query ? (
            <button
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="text-muted-foreground/80 hover:text-foreground hover:bg-muted cursor-pointer rounded-full transition-colors"
            >
              <X className="bg-muted-foreground/10 size-4 rounded-full p-0.5" />
            </button>
          ) : (
            <Search className="text-muted-foreground size-4" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="text-foreground placeholder-muted-foreground/70 w-full border-none bg-transparent p-0 text-sm font-normal outline-none focus:ring-0"
          />
        </div>

        {/* Action / Count Badge or Shortcut keys */}
        <div className="hidden px-2 sm:block">
          {!isOpen && (
            <KbdGroup data-icon="inline-end" className="opacity-80">
              <Kbd className="bg-muted/50 px-1 py-0.5 text-xs">Ctrl</Kbd>
              <Kbd className="bg-muted/50 px-1 py-0.5 text-xs">K</Kbd>
            </KbdGroup>
          )}
        </div>
      </div>

      {/* Backdrop overlay below the navbar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-x-0 top-16 bottom-0 -z-10 bg-zinc-950/15 backdrop-blur-sm dark:bg-zinc-950/40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Results Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 5 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-popover text-popover-foreground border-border fixed inset-x-4 top-20 z-50 flex max-h-96 flex-col overflow-hidden rounded-2xl border shadow-xl sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:w-screen sm:max-w-xl dark:shadow-2xl"
            >
              {/* List */}
              <div
                ref={resultsContainerRef}
                className="max-h-96 flex-1 scrollbar-thin overflow-y-auto p-2"
              >
                {!query ? (
                  <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
                    <Search className="mb-2 size-7 text-sky-500 opacity-65" />
                    <p className="text-foreground/80 text-xs font-semibold">
                      Search Mifos Documentation
                    </p>
                    <p className="text-muted-foreground/80 mt-1 max-w-xs text-xs">
                      Type to find documentation for various mifos products.
                    </p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
                    <div className="bg-destructive/10 mb-3 flex size-11 items-center justify-center rounded-full">
                      <X className="text-destructive size-7 opacity-65" />
                    </div>
                    <p className="text-foreground/80 text-xs font-semibold">
                      No results found
                    </p>
                    <p className="text-muted-foreground/80 mt-1 text-xs">
                      Try adjusting your keywords.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {results.map((result, index) => {
                      const isActive = index === selectedIndex;
                      const breadcrumbs = getBreadcrumbs(result);
                      return (
                        <div
                          key={result.id}
                          data-active={isActive ? "true" : "false"}
                          onClick={() => handleNavigate(result.url)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                            isActive
                              ? "text-foreground bg-sky-500/10 dark:bg-sky-500/15"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          {/* File Icon on Left */}
                          <div
                            className={`mt-0.5 hidden shrink-0 rounded-lg p-1.5 sm:block ${
                              isActive
                                ? "bg-sky-500/15 text-sky-500"
                                : "bg-muted text-muted-foreground/80"
                            }`}
                          >
                            <FileText className="h-4 w-4" />
                          </div>

                          {/* Content Detail */}
                          <div className="min-w-0 flex-1 pr-1">
                            {breadcrumbs.length > 0 && (
                              <Breadcrumb className="mb-0.5">
                                <BreadcrumbList className="text-muted-foreground/80 flex-nowrap gap-1 text-xs font-medium">
                                  {breadcrumbs.map((crumb, idx) => (
                                    <Fragment key={idx}>
                                      {idx > 0 && (
                                        <BreadcrumbSeparator className="opacity-60 [&>svg]:size-3" />
                                      )}
                                      <BreadcrumbItem>
                                        <span className="max-w-24 truncate sm:max-w-32 md:max-w-40">
                                          {crumb}
                                        </span>
                                      </BreadcrumbItem>
                                    </Fragment>
                                  ))}
                                </BreadcrumbList>
                              </Breadcrumb>
                            )}
                            <h4 className="truncate text-sm leading-tight font-semibold">
                              {result.title}
                            </h4>
                            {result.snippet && (
                              <p className="text-muted-foreground/80 mt-0.5 line-clamp-1 text-xs">
                                {result.snippet}
                              </p>
                            )}
                          </div>

                          {/* Action Arrow Icon on Right */}
                          <div className="hidden shrink-0 items-center self-center pl-2 sm:flex">
                            {isActive ? (
                              <div className="rounded-md bg-sky-500 p-1 text-white shadow-sm shadow-sky-500/20">
                                <CornerDownLeft className="h-3.5 w-3.5" />
                              </div>
                            ) : (
                              <ChevronRight className="text-muted-foreground/40 h-4 w-4" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer with Helper Keyboard Shortcuts */}
              <div className="border-border/80 bg-muted/30 text-muted-foreground/90 hidden items-center justify-between border-t px-4 py-2.5 text-xs select-none sm:flex">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium">
                    <KbdGroup>
                      <Kbd className="bg-background border-border rounded border px-1.5 py-0.5 text-xs">
                        ↑
                      </Kbd>
                      <Kbd className="bg-background border-border rounded border px-1.5 py-0.5 text-xs">
                        ↓
                      </Kbd>
                    </KbdGroup>
                    <span className="ml-1">Navigate</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium">
                    <Kbd className="bg-background border-border rounded border px-1.5 py-0.5 font-sans text-xs">
                      ESC
                    </Kbd>
                    <span className="ml-1">Close</span>
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
