"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: "h2" | "h3" | "h4";
}

interface RightSidebarProps {
  items?: TableOfContentsItem[];
  showTOC?: boolean;
}

const defaultItems: TableOfContentsItem[] = [
  { id: "installation", title: "Installation", level: "h2" },
  { id: "system-requirements", title: "System Requirements", level: "h3" },
  { id: "docker-setup", title: "Docker Setup", level: "h3" },
  { id: "configuration", title: "Configuration", level: "h2" },
  { id: "database", title: "Database Setup", level: "h3" },
  { id: "admin-settings", title: "Admin Settings", level: "h3" },
  { id: "first-steps", title: "First Steps", level: "h2" },
];

export function RightSidebar({
  items = defaultItems,
  showTOC = true,
}: RightSidebarProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!showTOC || !items || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" },
    );

    items.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items, showTOC]);

  if (!showTOC) return null;

  const displayItems = items && items.length > 0 ? items : defaultItems;

  return (
    <aside className="border-border bg-sidebar shrink-0 hidden w-60 border-l lg:block h-full overflow-y-auto p-5 text-sidebar-foreground">
      <div className="space-y-6">
        <div>
          <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            On this page
          </h3>

          <nav className="space-y-1">
            {displayItems.map((item) => (
              <Link
                key={item.id}
                href={`#${item.id}`}
                className={`block rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  activeId === item.id
                    ? "text-primary bg-accent font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                } ${item.level === "h3" ? "pl-5" : ""} ${
                  item.level === "h4" ? "pl-8" : ""
                }`}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        {/* Helpful Links Section */}
        <div className="border-border space-y-2 border-t pt-5">
          <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
            Resources
          </h4>
          <button
            onClick={() => window.dispatchEvent(new Event("open-search"))}
            className="text-muted-foreground hover:text-foreground block cursor-pointer text-xs transition-colors hover:underline"
          >
            Search Docs
          </button>
          <Link
            href="/help"
            className="text-muted-foreground hover:text-foreground block text-xs transition-colors hover:underline"
          >
            Get Help
          </Link>
          <Link
            href="/about"
            className="text-muted-foreground hover:text-foreground block text-xs transition-colors hover:underline"
          >
            About
          </Link>
          <Link
            href="/releases"
            className="text-muted-foreground hover:text-foreground block text-xs transition-colors hover:underline"
          >
            Releases
          </Link>
          <Link
            href="/settings"
            className="text-muted-foreground hover:text-foreground block text-xs transition-colors hover:underline"
          >
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}
