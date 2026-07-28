"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/searchbar";

interface NavbarProps {
  /** Toggles the mobile navigation sidebar. */
  onMenuClick: () => void;
  /** Whether the sidebar is currently open. */
  isSidebarOpen: boolean;
}

/**
 * Top navigation bar displayed across the documentation portal.
 *
 * Features:
 * - Mobile sidebar toggle
 * - Project logo
 * - Documentation search
 * - Light/Dark theme switch
 */
export function Navbar({ onMenuClick }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        {/* Logo and mobile navigation button */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="shrink-0 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="size-5" />
          </Button>
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Mifos Logo"
              width={24}
              height={24}
              className="size-5 sm:size-6"
            />
            <span className="text-foreground hidden text-base font-semibold tracking-tight sm:block lg:text-lg">
              Mifos Docs
            </span>
          </Link>
        </div>

        {/* Search and theme controls */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-3">
          <SearchBar />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 cursor-pointer"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label="Toggle theme"
          >
            {/* Light mode icon */}
            <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            {/* Dark mode icon */}
            <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
