"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { LeftSidebar } from "@/components/left-sidebar";
import { RightSidebar, TableOfContentsItem } from "@/components/right-sidebar";

interface MainLayoutProps {
  /** Content to render inside the main layout. */
  children: React.ReactNode;
  /** Whether the table of contents sidebar should be displayed. */
  showRightSidebar?: boolean;
  /** Custom TOC items for the right sidebar. */
  rightSidebarItems?: TableOfContentsItem[];
}

/**
 * Main application layout shared across documentation pages.
 */
export function MainLayout({
  children,
  showRightSidebar = true,
  rightSidebarItems,
}: MainLayoutProps) {
  // Controls the navigation sidebar state (open by default).
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="bg-background text-foreground flex h-screen flex-col overflow-hidden">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        {/* Main content area */}
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        {/* Table of Contents Right Sidebar */}
        {showRightSidebar && <RightSidebar items={rightSidebarItems} />}
      </div>
    </div>
  );
}
